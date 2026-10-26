// Reserves (Stage 1, sprint 5): the salary the person pays themselves, and what to set aside each month.
// Ganhômetro never holds money: it says what to move where. Relative imports with extensions, so
// `npm test` runs it directly with Node.
import { round2 } from "./tax.ts";

export type ReserveSettings = {
  salary: number | null; // the monthly salary to pay yourself; null when not set
  thirteenth: boolean; // set aside a 13th salary (1/12 a month)
  vacation: boolean; // set aside paid vacation: a month plus a third (CLT), 1/12 a month
  emergencyPct: number; // share of what's left that goes to the emergency fund
  emergencyMonths: number; // the fund's target, in months of salary
};

// From the month's take-home: what's yours after everything, and the tax and INSS still to be paid.
export type MonthMoney = { kept: number; tax: number; inss: number };

export type ReservePlan = {
  tax: number; // move to a tax account until the DARF or DAS is paid
  inss: number;
  salary: number;
  thirteenth: number;
  vacation: number;
  emergency: number;
  leftover: number; // what's left after salary and set-asides; negative means taking from the buffer
};

const thirteenthShare = (s: ReserveSettings) => (s.thirteenth ? 1 / 12 : 0);
const vacationShare = (s: ReserveSettings) => (s.vacation ? 4 / 3 / 12 : 0);

// One month's plan, given what's already in the emergency fund.
export function monthPlan(m: MonthMoney, s: ReserveSettings, emergencySoFar: number): ReservePlan {
  const salary = s.salary ?? 0;
  const thirteenth = salary * thirteenthShare(s);
  const vacation = salary * vacationShare(s);
  const room = Math.max(0, salary * s.emergencyMonths - emergencySoFar);
  const emergency = Math.min(room, Math.max(0, m.kept) * (s.emergencyPct / 100));
  return {
    tax: round2(m.tax),
    inss: round2(m.inss),
    salary: round2(salary),
    thirteenth: round2(thirteenth),
    vacation: round2(vacation),
    emergency: round2(emergency),
    leftover: round2(m.kept - salary - thirteenth - vacation - emergency),
  };
}

export type ReserveHistory = {
  plans: ReservePlan[];
  buffer: number; // the "colchão": leftovers of good months minus what weak months took
  thirteenthFund: number; // since January (the 13th is paid in December)
  vacationFund: number;
  emergencyFund: number;
};

// Running balances over consecutive months, oldest first. firstMonth is 1–12, for the 13th's yearly reset.
export function reserveHistory(months: MonthMoney[], s: ReserveSettings, firstMonth: number): ReserveHistory {
  let buffer = 0;
  let thirteenthFund = 0;
  let vacationFund = 0;
  let emergencyFund = 0;
  const plans = months.map((m, i) => {
    if ((firstMonth - 1 + i) % 12 === 0 && i > 0) thirteenthFund = 0; // January: last year's 13th was paid
    const plan = monthPlan(m, s, emergencyFund);
    buffer += plan.leftover;
    thirteenthFund += plan.thirteenth;
    vacationFund += plan.vacation;
    emergencyFund += plan.emergency;
    return plan;
  });
  return { plans, buffer: round2(buffer), thirteenthFund: round2(thirteenthFund), vacationFund: round2(vacationFund), emergencyFund: round2(emergencyFund) };
}

// A salary the average month can pay along with its set-asides, rounded down to R$ 100. null without history.
export function suggestedSalary(keptByMonth: number[], s: ReserveSettings): number | null {
  const recent = keptByMonth.filter((k) => k > 0).slice(-6);
  if (!recent.length) return null;
  const average = recent.reduce((a, b) => a + b, 0) / recent.length;
  const salary = (average * (1 - s.emergencyPct / 100)) / (1 + thirteenthShare(s) + vacationShare(s));
  return Math.max(0, Math.floor(salary / 100) * 100);
}
