import { prompt } from "@cursor/bdk";
import { defineTool } from "@cursor/bdk/tools";
import { z } from "zod";
import { buildMddReport, type CloseBar, type MddReport } from "../lib/mdd.js";

const SYMBOL = "TSLA";
const DEFAULT_START_YEAR = 2010;
const CACHE_TTL_MS = 60 * 60 * 1000;
const CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/TSLA";

const inputSchema = z.object({
  startYear: z
    .number()
    .int()
    .min(DEFAULT_START_YEAR)
    .max(new Date().getUTCFullYear())
    .optional()
    .describe("First calendar year of daily closes. Omit for the full TSLA history."),
});

type CacheEntry = {
  exp: number;
  report: MddReport;
};

export default defineTool({
  description: prompt`
    Compute Tesla (TSLA) drawdown from split-adjusted daily closes.
    Call this before any answer about TSLA price, drawdown, or MDD.
    Omit startYear unless the user names a first calendar year.
    currentDrawdown is the latest close versus its running peak.
    maximumDrawdown is the deepest peak-to-trough on that same series.
    chartLevels.mean1Percent, mean2Percent, and mean3Percent are the
    desktop MDD chart's Mean1, Mean2, and Mean3 lines.
  `,
  inputSchema,
  effect: "read",
  async execute({ startYear }, ctx) {
    const year = startYear ?? DEFAULT_START_YEAR;
    const cacheKey = `tsla-mdd:v1:${year}`;
    const cached = readCache(await ctx.host.kv.get(cacheKey));
    const now = Date.now();

    if (cached && cached.exp > now) return cached.report;

    if (cached) await ctx.host.kv.delete(cacheKey);

    let report: MddReport;
    try {
      const fetched = await fetchCloses(year);
      report = buildMddReport({
        bars: fetched.bars,
        currency: fetched.currency,
        name: fetched.name,
        startYear: year,
        fetchedAt: new Date(now).toISOString(),
      });
    } catch (error) {
      if (cached) {
        return {
          ...cached.report,
          stale: true,
          warning: "Yahoo Finance was unavailable. Figures are from the last successful fetch.",
        };
      }
      const message = error instanceof Error ? error.message : "TSLA price fetch failed";
      throw new Error(message);
    }

    const entry: CacheEntry = { exp: now + CACHE_TTL_MS, report };
    try {
      await ctx.host.kv.put(cacheKey, entry);
    } catch {
      // A missed cache write still leaves the caller with a fresh report.
    }
    return report;
  },
});

type YahooChart = {
  chart?: {
    result?: Array<{
      meta?: { currency?: string; shortName?: string; longName?: string };
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: Array<number | null> }> };
    }> | null;
    error?: { description?: string } | null;
  };
};

async function fetchCloses(startYear: number): Promise<{ bars: CloseBar[]; currency: string; name: string }> {
  const period1 = Math.floor(Date.UTC(startYear, 0, 1) / 1000);
  const period2 = Math.floor(Date.now() / 1000);
  const url = new URL(CHART_URL);
  url.searchParams.set("interval", "1d");
  url.searchParams.set("period1", String(period1));
  url.searchParams.set("period2", String(period2));

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0",
    },
    signal: AbortSignal.timeout(15_000),
  });

  const body = (await response.json()) as YahooChart;
  if (!response.ok || body.chart?.error) {
    throw new Error(body.chart?.error?.description ?? `Yahoo Finance chart request failed (${response.status})`);
  }

  const result = body.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];
  const count = Math.min(timestamps.length, closes.length);
  const bars: CloseBar[] = [];

  for (let i = 0; i < count; i++) {
    const close = closes[i];
    const timestamp = timestamps[i];
    if (close == null || timestamp == null || !Number.isFinite(close) || close <= 0) continue;
    bars.push({ date: newYorkDate(timestamp), close });
  }

  if (bars.length < 2) {
    throw new Error(`Not enough ${SYMBOL} daily closes from ${startYear}`);
  }

  return {
    bars,
    currency: result?.meta?.currency ?? "USD",
    name: result?.meta?.shortName ?? result?.meta?.longName ?? "Tesla, Inc.",
  };
}

function newYorkDate(unixSeconds: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(unixSeconds * 1000));
}

function readCache(value: unknown): CacheEntry | undefined {
  if (value === undefined || value === null || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.exp !== "number" || record.report === null || typeof record.report !== "object") return undefined;
  const report = record.report as MddReport;
  if (report.symbol !== SYMBOL || typeof report.asOf !== "string") return undefined;
  return { exp: record.exp, report };
}
