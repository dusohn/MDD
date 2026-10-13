import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMddReport } from "./mdd.js";

const fetchedAt = "2020-01-08T21:00:00.000Z";

test("drawdown series matches the desktop MDD formula", () => {
  const report = buildMddReport({
    bars: [
      { date: "2020-01-01", close: 10 },
      { date: "2020-01-02", close: 12 },
      { date: "2020-01-03", close: 9 },
      { date: "2020-01-06", close: 11 },
      { date: "2020-01-07", close: 8 },
      { date: "2020-01-08", close: 13 },
    ],
    currency: "USD",
    name: "Tesla, Inc.",
    startYear: 2020,
    fetchedAt,
  });

  assert.equal(report.symbol, "TSLA");
  assert.equal(report.lastClose, 13);
  assert.equal(report.currentDrawdown.percent, 0);
  assert.equal(report.currentDrawdown.peakDate, "2020-01-08");
  assert.equal(report.maximumDrawdown.percent, -33.3);
  assert.equal(report.maximumDrawdown.ratio, -0.3333);
  assert.equal(report.maximumDrawdown.peakDate, "2020-01-02");
  assert.equal(report.maximumDrawdown.peakClose, 12);
  assert.equal(report.maximumDrawdown.troughDate, "2020-01-07");
  assert.equal(report.maximumDrawdown.troughClose, 8);
  assert.equal(report.maximumDrawdown.tradingDays, 3);
  assert.equal(report.maximumDrawdown.recovered, true);
  assert.equal(report.maximumDrawdown.recoveryDate, "2020-01-08");
  assert.equal(report.chartLevels.inflectionCount, 2);
  assert.equal(report.chartLevels.mean1Percent, -29.2);
  assert.equal(report.chartLevels.mean2Percent, -33.3);
  assert.equal(report.chartLevels.mean3Percent, null);
  assert.deepEqual(report.worstEpisodes, [
    {
      peakDate: "2020-01-02",
      peakClose: 12,
      troughDate: "2020-01-07",
      troughClose: 8,
      percent: -33.3,
      tradingDays: 3,
      recoveryDate: "2020-01-08",
    },
  ]);
  assert.deepEqual(report.yearly, [{ year: 2020, worstPercent: -33.3, yearEndPercent: 0 }]);
});

test("an unfinished decline has no recovery date", () => {
  const report = buildMddReport({
    bars: [
      { date: "2024-01-02", close: 10 },
      { date: "2024-01-03", close: 8 },
    ],
    currency: "USD",
    name: "Tesla, Inc.",
    startYear: 2024,
    fetchedAt,
  });

  assert.equal(report.currentDrawdown.percent, -20);
  assert.equal(report.currentDrawdown.peakDate, "2024-01-02");
  assert.equal(report.maximumDrawdown.percent, -20);
  assert.equal(report.maximumDrawdown.recovered, false);
  assert.equal(report.maximumDrawdown.recoveryDate, null);
  assert.equal(report.chartLevels.inflectionCount, 0);
  assert.equal(report.chartLevels.mean1Percent, null);
  assert.equal(report.worstEpisodes.length, 1);
  assert.equal(report.worstEpisodes[0]!.recoveryDate, null);
});
