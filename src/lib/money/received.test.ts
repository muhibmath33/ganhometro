import assert from "node:assert/strict";
import { test } from "node:test";
import { checkUnderpayment, defaultPeriods, monthTakeHome, periodShare, receivedSummary } from "./received.ts";
import type { RateEntry } from "./realRate.ts";

const SP = "America/Sao_Paulo";
const NOW = Date.parse("2026-10-27T23:00:00Z");
// An entry on a São Paulo day, from hour a to hour b (local time = UTC−3).
const entry = (day: string, a: number, b: number, kind: RateEntry["kind"] = "paid", units: number | null = null): RateEntry => ({
  kind,
  started_at: new Date(Date.parse(`${day}T00:00:00Z`) + (a + 3) * 3_600_000).toISOString(),
  ended_at: new Date(Date.parse(`${day}T00:00:00Z`) + (b + 3) * 3_600_000).toISOString(),
  units,
});
const close = (a: number | null | undefined, b: number) => assert.ok(a !== null && a !== undefined && Math.abs(a - b) < 1e-6, `${a} ≈ ${b}`);
const hourly = { pay_model: "hourly" as const, rate: 25, commission_pct: null };

test("a payment's share of a period is by calendar days", () => {
  const p = { amount: 700, received_on: "2026-10-14", period_start: "2026-10-01", period_end: "2026-10-07" };
  close(periodShare(p, "2026-10-01", "2026-10-31"), 1);
  close(periodShare(p, "2026-10-05", "2026-10-31"), 3 / 7);
  close(periodShare(p, "2026-10-08", "2026-10-31"), 0);
  // No period: the payment covers the day it was received.
  close(periodShare({ amount: 1, received_on: "2026-10-14", period_start: null, period_end: null }, "2026-10-01", "2026-10-31"), 1);
});

test("real rate from money received: paid ÷ hours in the days it covers", () => {
  const entries = [entry("2026-10-01", 9, 17), entry("2026-10-02", 9, 13, "unpaid"), entry("2026-10-20", 9, 12)];
  const payments = [{ amount: 200, received_on: "2026-10-08", period_start: "2026-10-01", period_end: "2026-10-07" }];
  const s = receivedSummary(hourly, entries, payments, { fromDay: "2026-10-01", toDay: "2026-10-27", timeZone: SP, now: NOW });
  close(s.earned, 200);
  close(s.coveredHours, 12); // 8 paid + 4 unpaid in 1–7 October
  close(s.realRate, 200 / 12);
  close(s.uncoveredHours, 3); // 20 October isn't paid yet
});

test("commission comes off what was received", () => {
  const s = receivedSummary(
    { ...hourly, commission_pct: 10 },
    [entry("2026-10-01", 9, 19)],
    [{ amount: 250, received_on: "2026-10-01", period_start: "2026-10-01", period_end: "2026-10-01" }],
    { fromDay: "2026-10-01", toDay: "2026-10-31", timeZone: SP, now: NOW },
  );
  close(s.realRate, 22.5);
});

test("overlapping payment periods don't count hours twice", () => {
  const s = receivedSummary(
    hourly,
    [entry("2026-10-03", 9, 13)],
    [
      { amount: 50, received_on: "2026-10-05", period_start: "2026-10-01", period_end: "2026-10-05" },
      { amount: 50, received_on: "2026-10-06", period_start: "2026-10-03", period_end: "2026-10-03" },
    ],
    { fromDay: "2026-10-01", toDay: "2026-10-31", timeZone: SP, now: NOW },
  );
  close(s.coveredHours, 4);
});

test("possível diferença: flagged above max(2, 3%)", () => {
  const entries = [entry("2026-10-01", 9, 17), entry("2026-10-02", 9, 11, "unpaid")];
  const period = { received_on: "2026-10-08", period_start: "2026-10-01", period_end: "2026-10-07" };
  const ctx = { timeZone: SP, now: NOW };
  const short = checkUnderpayment(hourly, { amount: 180, ...period }, entries, ctx)!; // 8 h × 25 = 200 expected
  close(short.expected, 200);
  close(short.difference, 20);
  assert.equal(short.flagged, true);
  assert.equal(checkUnderpayment(hourly, { amount: 195, ...period }, entries, ctx)!.flagged, false); // 2,5% short
  assert.equal(checkUnderpayment({ pay_model: "fixed", rate: null, commission_pct: null }, { amount: 1, ...period }, entries, ctx), null);
});

test("per task: tasks × rate", () => {
  const u = checkUnderpayment(
    { pay_model: "per_task", rate: 2, commission_pct: null },
    { amount: 50, received_on: "2026-10-08", period_start: "2026-10-01", period_end: "2026-10-07" },
    [entry("2026-10-01", 9, 12, "paid", 30)],
    { timeZone: SP, now: NOW },
  )!;
  close(u.expected, 60);
  assert.equal(u.flagged, true);
});

test("take-home as an individual: commission, fees, INSS and carnê-leão", () => {
  const t = monthTakeHome(
    [
      { taxBrl: 16000, marketBrl: 16500, arrivedBrl: 16200, commissionPct: 0 },
      { taxBrl: 1000, marketBrl: 1000, arrivedBrl: null, commissionPct: 10 },
    ],
    { tax_mode: "pf", inss_plan: "full", dependents: 0, accountant_cost: 250 },
  );
  close(t.received, 17500);
  close(t.commission, 100);
  close(t.fees, 300);
  assert.equal(t.feesUnknown, 1);
  close(t.taxBase, 17000);
  close(t.inss, 1695.11);
  close(t.tax, 3300.11); // (17.000 − 1.695,11) × 27,5% − 908,73
  close(t.kept, 17500 - 100 - 300 - 1695.11 - 3300.11);
});

test("take-home with a company, and payments without a rate", () => {
  const t = monthTakeHome(
    [
      { taxBrl: 16500, marketBrl: 16500, arrivedBrl: 16500, commissionPct: 0 },
      { taxBrl: null, marketBrl: null, arrivedBrl: null, commissionPct: 0 },
    ],
    { tax_mode: "cnpj", inss_plan: "full", dependents: 0, accountant_cost: 250 },
  );
  assert.equal(t.missingRates, 1);
  close(t.das, 543.61);
  close(t.inss, 508.2);
  close(t.accountant, 250);
  close(t.kept, 16500 - 543.61 - 508.2 - 250);
});

test("default work periods run from the previous payment to the day received", () => {
  assert.deepEqual(defaultPeriods("2026-10-07", null, ["2026-10-14", "2026-10-21"]), [
    ["2026-10-08", "2026-10-14"],
    ["2026-10-15", "2026-10-21"],
  ]);
});

test("a source's first payment starts at its first logged hour", () => {
  assert.deepEqual(defaultPeriods(null, "2026-10-01", ["2026-10-14"]), [["2026-10-01", "2026-10-14"]]);
  assert.deepEqual(defaultPeriods(null, null, ["2026-10-14"]), [["2026-10-14", "2026-10-14"]]);
  assert.deepEqual(defaultPeriods(null, "2026-10-20", ["2026-10-14"]), [["2026-10-14", "2026-10-14"]]); // work logged later
});
