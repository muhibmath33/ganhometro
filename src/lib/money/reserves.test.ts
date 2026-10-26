import assert from "node:assert/strict";
import { test } from "node:test";
import { latePayday, paydays, type Schedule } from "./paydays.ts";
import { monthPlan, reserveHistory, suggestedSalary } from "./reserves.ts";

const settings = { salary: 6000, thirteenth: true, vacation: true, emergencyPct: 10, emergencyMonths: 6 };
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 0.01, `${a} ≈ ${b}`);

test("a month's plan: salary, 13th, vacation, emergency and what's left", () => {
  const p = monthPlan({ kept: 9000, tax: 1200, inss: 1695.11 }, settings, 0);
  close(p.thirteenth, 500); // 6.000 ÷ 12
  close(p.vacation, 666.67); // 6.000 × 4/3 ÷ 12
  close(p.emergency, 900); // 10% of 9.000
  close(p.leftover, 9000 - 6000 - 500 - 666.67 - 900);
  close(p.tax, 1200);
});

test("the emergency fund stops at its target", () => {
  close(monthPlan({ kept: 9000, tax: 0, inss: 0 }, settings, 36000 - 100).emergency, 100);
  close(monthPlan({ kept: 9000, tax: 0, inss: 0 }, settings, 36000).emergency, 0);
});

test("a weak month takes from the buffer; funds add up; the 13th resets in January", () => {
  const h = reserveHistory(
    [
      { kept: 12000, tax: 0, inss: 0 }, // November
      { kept: 4000, tax: 0, inss: 0 }, // December
      { kept: 9000, tax: 0, inss: 0 }, // January
    ],
    settings,
    11,
  );
  assert.ok(h.plans[1].leftover < 0, "December takes from the buffer");
  close(h.buffer, h.plans.reduce((sum, p) => sum + p.leftover, 0));
  close(h.thirteenthFund, 500); // only January's
  close(h.vacationFund, 3 * 666.67);
  close(h.emergencyFund, 1200 + 400 + 900);
});

test("no salary set: everything kept is leftover", () => {
  const p = monthPlan({ kept: 5000, tax: 0, inss: 0 }, { ...settings, salary: null }, 0);
  assert.equal(p.salary, 0);
  close(p.leftover, 5000);
});

test("suggested salary: what the average month can pay with its set-asides", () => {
  // average 9.000 → 9.000 × 0,9 ÷ (1 + 1/12 + 1/9) = 6.781 → 6.700
  assert.equal(suggestedSalary([0, 8000, 10000, 9000], settings), 6700);
  assert.equal(suggestedSalary([0, 0], settings), null);
});

const weekly: Schedule = { pay_schedule: "weekly", pay_weekday: 3, pay_day: null, grace_days: 2 }; // Wednesdays

test("paydays: weekly, every two weeks from an anchor, monthly at the month's end", () => {
  assert.deepEqual(paydays(weekly, "2026-10-01", "2026-10-31"), ["2026-10-07", "2026-10-14", "2026-10-21", "2026-10-28"]);
  assert.deepEqual(paydays({ ...weekly, pay_schedule: "biweekly" }, "2026-10-01", "2026-10-31", "2026-09-30"), ["2026-10-14", "2026-10-28"]);
  assert.deepEqual(paydays({ pay_schedule: "monthly", pay_weekday: null, pay_day: 31, grace_days: 2 }, "2026-01-15", "2026-03-31"), [
    "2026-01-31",
    "2026-02-28",
    "2026-03-31",
  ]);
  assert.deepEqual(paydays({ pay_schedule: "irregular", pay_weekday: null, pay_day: null, grace_days: 2 }, "2026-10-01", "2026-10-31"), []);
});

test("late: work done, the payday plus grace passed, no payment since", () => {
  const late = latePayday(weekly, { today: "2026-10-26", lastPayment: "2026-10-14", paidWorkDays: ["2026-10-12", "2026-10-16"] });
  assert.deepEqual(late, { payday: "2026-10-21", workSince: "2026-10-16" });
});

test("not late: within the grace days, paid early, or no work owed", () => {
  assert.equal(latePayday(weekly, { today: "2026-10-22", lastPayment: "2026-10-14", paidWorkDays: ["2026-10-16"] }), null); // 21st + 2 days grace
  assert.equal(latePayday(weekly, { today: "2026-10-26", lastPayment: "2026-10-20", paidWorkDays: ["2026-10-16"] }), null); // paid a day early
  assert.equal(latePayday(weekly, { today: "2026-10-26", lastPayment: "2026-10-14", paidWorkDays: ["2026-10-22"] }), null); // work after the payday
  assert.equal(latePayday(weekly, { today: "2026-10-26", lastPayment: "2026-10-14", paidWorkDays: [] }), null);
});
