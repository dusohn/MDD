/** Drawdown math aligned with `MDD.py`: running peak, then (close - peak) / peak. */

export type CloseBar = {
  date: string;
  close: number;
};

export type DrawdownSnapshot = {
  ratio: number;
  percent: number;
  peakDate: string;
  peakClose: number;
  tradingDaysSincePeak: number;
};

export type MaximumDrawdown = {
  ratio: number;
  percent: number;
  peakDate: string;
  peakClose: number;
  troughDate: string;
  troughClose: number;
  tradingDays: number;
  recovered: boolean;
  recoveryDate: string | null;
};

export type ChartLevels = {
  inflectionCount: number;
  mean1Percent: number | null;
  mean2Percent: number | null;
  mean3Percent: number | null;
};

export type DrawdownEpisode = {
  peakDate: string;
  peakClose: number;
  troughDate: string;
  troughClose: number;
  percent: number;
  tradingDays: number;
  recoveryDate: string | null;
};

export type YearDrawdown = {
  year: number;
  worstPercent: number;
  yearEndPercent: number;
};

export type RecentClose = {
  date: string;
  close: number;
  percent: number;
};

export type MddReport = {
  symbol: "TSLA";
  name: string;
  currency: string;
  source: "yahoo-finance-chart";
  startYear: number;
  asOf: string;
  fetchedAt: string;
  tradingDays: number;
  lastClose: number;
  stale: boolean;
  warning: string | null;
  currentDrawdown: DrawdownSnapshot;
  maximumDrawdown: MaximumDrawdown;
  chartLevels: ChartLevels;
  worstEpisodes: DrawdownEpisode[];
  yearly: YearDrawdown[];
  recent: RecentClose[];
};

type Point = {
  date: string;
  close: number;
  peakClose: number;
  peakDate: string;
  drawdown: number;
};

export function buildMddReport(input: {
  bars: CloseBar[];
  currency: string;
  name: string;
  startYear: number;
  fetchedAt: string;
}): MddReport {
  if (input.bars.length < 2) {
    throw new Error("Not enough TSLA closes to compute drawdown");
  }

  const points = runningDrawdown(input.bars);
  const last = points[points.length - 1]!;
  const troughIndex = indexOfMinimum(points);
  const trough = points[troughIndex]!;
  const maxPeakIndex = indexOfDate(points, trough.peakDate, troughIndex);
  const currentPeakIndex = indexOfDate(points, last.peakDate, points.length - 1);
  const recoveryDate = findRecoveryDate(points, troughIndex, trough.peakClose);
  const levels = chartLevels(points);

  return {
    symbol: "TSLA",
    name: input.name,
    currency: input.currency,
    source: "yahoo-finance-chart",
    startYear: input.startYear,
    asOf: last.date,
    fetchedAt: input.fetchedAt,
    tradingDays: points.length,
    lastClose: roundTo(last.close, 2),
    stale: false,
    warning: null,
    currentDrawdown: {
      ratio: roundTo(last.drawdown, 4),
      percent: roundTo(last.drawdown * 100, 1),
      peakDate: last.peakDate,
      peakClose: roundTo(last.peakClose, 2),
      tradingDaysSincePeak: points.length - 1 - currentPeakIndex,
    },
    maximumDrawdown: {
      ratio: roundTo(trough.drawdown, 4),
      percent: roundTo(trough.drawdown * 100, 1),
      peakDate: trough.peakDate,
      peakClose: roundTo(trough.peakClose, 2),
      troughDate: trough.date,
      troughClose: roundTo(trough.close, 2),
      tradingDays: troughIndex - maxPeakIndex,
      recovered: recoveryDate !== null,
      recoveryDate,
    },
    chartLevels: levels,
    worstEpisodes: worstEpisodes(points, 3),
    yearly: yearlyDrawdowns(points),
    recent: points.slice(-10).map((point) => ({
      date: point.date,
      close: roundTo(point.close, 2),
      percent: roundTo(point.drawdown * 100, 1),
    })),
  };
}

function runningDrawdown(bars: CloseBar[]): Point[] {
  const points: Point[] = [];
  let peakClose = bars[0]!.close;
  let peakDate = bars[0]!.date;

  for (const bar of bars) {
    if (bar.close >= peakClose) {
      peakClose = bar.close;
      peakDate = bar.date;
    }
    points.push({
      date: bar.date,
      close: bar.close,
      peakClose,
      peakDate,
      drawdown: (bar.close - peakClose) / peakClose,
    });
  }

  return points;
}

function indexOfMinimum(points: Point[]): number {
  let index = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i]!.drawdown < points[index]!.drawdown) index = i;
  }
  return index;
}

function indexOfDate(points: Point[], date: string, notAfter: number): number {
  for (let i = notAfter; i >= 0; i--) {
    if (points[i]!.date === date) return i;
  }
  return notAfter;
}

function findRecoveryDate(points: Point[], troughIndex: number, peakClose: number): string | null {
  for (let i = troughIndex + 1; i < points.length; i++) {
    if (points[i]!.close >= peakClose) return points[i]!.date;
  }
  return null;
}

/**
 * Mean1/Mean2/Mean3 from `MDD.py`.
 * Mean1 averages strict local minima of the drawdown series.
 * Mean2 averages every daily drawdown deeper than Mean1.
 * Mean3 averages the Mean2 sample that is deeper than Mean2.
 */
function chartLevels(points: Point[]): ChartLevels {
  const inflections: number[] = [];
  for (let i = 0; i < points.length; i++) {
    const previous = points[i === 0 ? 0 : i - 1]!.drawdown;
    const current = points[i]!.drawdown;
    const next = points[i === points.length - 1 ? i : i + 1]!.drawdown;
    if (previous > current && current < next) inflections.push(current);
  }

  const mean1 = mean(inflections);
  const belowMean1 = mean1 === null ? [] : points.map((point) => point.drawdown).filter((value) => value < mean1);
  const mean2 = mean(belowMean1);
  const belowMean2 = mean2 === null ? [] : belowMean1.filter((value) => value < mean2);
  const mean3 = mean(belowMean2);

  return {
    inflectionCount: inflections.length,
    mean1Percent: mean1 === null ? null : roundTo(mean1 * 100, 1),
    mean2Percent: mean2 === null ? null : roundTo(mean2 * 100, 1),
    mean3Percent: mean3 === null ? null : roundTo(mean3 * 100, 1),
  };
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  let total = 0;
  for (const value of values) total += value;
  return total / values.length;
}

function worstEpisodes(points: Point[], limit: number): DrawdownEpisode[] {
  const episodes: DrawdownEpisode[] = [];
  let peakIndex = 0;
  let troughIndex = 0;

  for (let i = 1; i < points.length; i++) {
    const point = points[i]!;
    if (point.drawdown === 0) {
      pushEpisode(points, peakIndex, troughIndex, point.date, episodes);
      peakIndex = i;
      troughIndex = i;
      continue;
    }
    if (point.drawdown < points[troughIndex]!.drawdown) troughIndex = i;
  }

  pushEpisode(points, peakIndex, troughIndex, null, episodes);
  episodes.sort((a, b) => a.percent - b.percent);
  return episodes.slice(0, limit);
}

function pushEpisode(
  points: Point[],
  peakIndex: number,
  troughIndex: number,
  recoveryDate: string | null,
  episodes: DrawdownEpisode[],
): void {
  const trough = points[troughIndex]!;
  if (trough.drawdown >= 0) return;
  const peak = points[peakIndex]!;
  episodes.push({
    peakDate: peak.date,
    peakClose: roundTo(peak.close, 2),
    troughDate: trough.date,
    troughClose: roundTo(trough.close, 2),
    percent: roundTo(trough.drawdown * 100, 1),
    tradingDays: troughIndex - peakIndex,
    recoveryDate,
  });
}

function yearlyDrawdowns(points: Point[]): YearDrawdown[] {
  const years: YearDrawdown[] = [];
  let currentYear = Number(points[0]!.date.slice(0, 4));
  let worst = points[0]!.drawdown;
  let yearEnd = points[0]!.drawdown;

  const flush = () => {
    years.push({
      year: currentYear,
      worstPercent: roundTo(worst * 100, 1),
      yearEndPercent: roundTo(yearEnd * 100, 1),
    });
  };

  for (const point of points) {
    const year = Number(point.date.slice(0, 4));
    if (year !== currentYear) {
      flush();
      currentYear = year;
      worst = point.drawdown;
    } else if (point.drawdown < worst) {
      worst = point.drawdown;
    }
    yearEnd = point.drawdown;
  }
  flush();
  return years;
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
