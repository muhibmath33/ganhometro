import assert from "node:assert/strict";
import { test } from "node:test";
import { incomeReport, monthKeys, timesheetRows, toCsv } from "./reports.ts";

test("month keys across a year", () => {
  assert.deepEqual(monthKeys("2025-11", "2026-02"), ["2025-11", "2025-12", "2026-01", "2026-02"]);
});

test("income report: months, average over the whole period, payers by size, missing rates apart", () => {
  const r = incomeReport(
    [
      { received_on: "2026-08-10", source: "ACME", amount: 1000, currency: "USD", brl: 5400 },
      { received_on: "2026-10-05", source: "Upwork", amount: 300, currency: "USD", brl: 1620 },
      { received_on: "2026-10-20", source: "ACME", amount: 500, currency: "USD", brl: 2700 },
      { received_on: "2026-10-21", source: "Outro", amount: 50, currency: "EUR", brl: null },
      { received_on: "2026-11-01", source: "ACME", amount: 999, currency: "USD", brl: 5000 }, // outside
    ],
    "2026-08",
    "2026-10",
  );
  assert.deepEqual(
    r.months.map((m) => [m.key, m.count, m.brl]),
    [["2026-08", 1, 5400], ["2026-09", 0, 0], ["2026-10", 3, 4320]],
  );
  assert.equal(r.total, 9720);
  assert.equal(r.average, 3240); // 9.720 over 3 months, the empty one included
  assert.equal(r.monthsWithIncome, 2);
  assert.deepEqual(r.sources, ["ACME", "Upwork", "Outro"]);
  assert.equal(r.missing, 1);
  assert.equal(r.payments.length, 4);
});

test("timesheet: clipped to the period, São Paulo days and times, paid only", () => {
  const at = (day: string, hour: number) => new Date(Date.parse(`${day}T00:00:00Z`) + (hour + 3) * 3_600_000).toISOString();
  const entries = [
    { started_at: at("2026-10-01", 9), ended_at: at("2026-10-01", 11.5), kind: "paid" as const, label: "Site" },
    { started_at: at("2026-10-01", 11.5), ended_at: at("2026-10-01", 12), kind: "unpaid" as const, label: null },
    { started_at: at("2026-10-07", 23), ended_at: at("2026-10-08", 1), kind: "paid" as const, label: null }, // 1 h inside
    { started_at: at("2026-10-09", 9), ended_at: at("2026-10-09", 10), kind: "paid" as const, label: null }, // outside
  ];
  const ctx = { fromDay: "2026-10-01", toDay: "2026-10-07", timeZone: "America/Sao_Paulo", now: Date.parse("2026-10-27T12:00:00Z") };
  const all = timesheetRows(entries, ctx);
  assert.deepEqual(
    all.rows.map((r) => [r.day, r.start, r.end, r.hours, r.kind]),
    [
      ["2026-10-01", "09:00", "11:30", 2.5, "paid"],
      ["2026-10-01", "11:30", "12:00", 0.5, "unpaid"],
      ["2026-10-07", "23:00", "01:00", 1, "paid"],
    ],
  );
  assert.equal(all.paidHours, 3.5);
  assert.equal(all.unpaidHours, 0.5);
  assert.equal(timesheetRows(entries, { ...ctx, paidOnly: true }).rows.length, 2);
});

test("CSV for a Brazilian Excel and for English", () => {
  assert.equal(toCsv([["Data", "Valor"], ["2026-10-01", 1234.5], ["ACME; Inc", null]], "pt"), '﻿Data;Valor\r\n2026-10-01;1234,5\r\n"ACME; Inc";\r\n');
  assert.equal(toCsv([["Date", "Amount"], ["2026-10-01", 1234.5]], "en"), "﻿Date,Amount\r\n2026-10-01,1234.5\r\n");
});
