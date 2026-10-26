import assert from "node:assert/strict";
import { test } from "node:test";
import { addDays, dayKey, formatClock, formatDuration, startOfDay, timeKey, zonedToUtc } from "./time.ts";

const SP = "America/Sao_Paulo";

test("São Paulo wall clock → UTC (UTC−3, no daylight saving since 2019)", () => {
  assert.equal(zonedToUtc("2026-10-27", "09:30", SP)?.toISOString(), "2026-10-27T12:30:00.000Z");
  assert.equal(startOfDay("2026-10-27", SP).toISOString(), "2026-10-27T03:00:00.000Z");
});

test("UTC → São Paulo day and time, including late evening", () => {
  const lateEvening = new Date("2026-10-28T02:15:00Z"); // 23:15 on the 27th in São Paulo
  assert.equal(dayKey(lateEvening, SP), "2026-10-27");
  assert.equal(timeKey(lateEvening, SP), "23:15");
});

test("daylight-saving zones resolve on both sides of the change", () => {
  // New York springs forward on 8 Mar 2026: EST (−5) before, EDT (−4) after.
  assert.equal(zonedToUtc("2026-03-07", "12:00", "America/New_York")?.toISOString(), "2026-03-07T17:00:00.000Z");
  assert.equal(zonedToUtc("2026-03-09", "12:00", "America/New_York")?.toISOString(), "2026-03-09T16:00:00.000Z");
});

test("invalid dates and times are rejected", () => {
  assert.equal(zonedToUtc("2026-02-30", "10:00", SP), null);
  assert.equal(zonedToUtc("2026-10-27", "24:00", SP), null);
  assert.equal(zonedToUtc("27/10/2026", "10:00", SP), null);
  assert.equal(zonedToUtc("2026-10-27", "", SP), null);
});

test("addDays crosses months and years", () => {
  assert.equal(addDays("2026-10-27", 5), "2026-11-01");
  assert.equal(addDays("2027-01-01", -1), "2026-12-31");
});

test("durations and the timer clock", () => {
  assert.equal(formatDuration(9_000_000, "pt-BR"), "2h30");
  assert.equal(formatDuration(7_200_000, "pt-BR"), "2h");
  assert.equal(formatDuration(2_700_000, "pt-BR"), "45 min");
  assert.equal(formatDuration(9_000_000, "en"), "2h 30m");
  assert.equal(formatDuration(3_900_000, "pt-BR"), "1h05");
  assert.equal(formatClock(5_025_000), "01:23:45");
});
