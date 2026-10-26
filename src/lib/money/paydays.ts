// Expected paydays from a source's schedule, and whether a payment looks late (feature 4).
// Relative imports with extensions, so `npm test` runs it directly with Node.
import { addDays } from "../app/time.ts";

export type Schedule = {
  pay_schedule: "weekly" | "biweekly" | "monthly" | "on_invoice" | "irregular";
  pay_weekday: number | null; // 0 = Sunday
  pay_day: number | null; // 1–31
  grace_days: number;
};

const weekday = (day: string) => new Date(`${day}T12:00:00Z`).getUTCDay();
const dayNumber = (day: string) => Math.round(Date.parse(`${day}T12:00:00Z`) / 86_400_000);
const lastDayOfMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();

// Paydays between two days (inclusive), oldest first. Every two weeks counts from an anchor day: the
// source's first payment, or the day it was added. Invoices and irregular payers have no fixed payday.
export function paydays(s: Schedule, fromDay: string, toDay: string, anchor?: string): string[] {
  const days: string[] = [];
  if ((s.pay_schedule === "weekly" || s.pay_schedule === "biweekly") && s.pay_weekday !== null) {
    let first = anchor ?? fromDay;
    while (weekday(first) !== s.pay_weekday) first = addDays(first, 1);
    const step = s.pay_schedule === "weekly" ? 7 : 14;
    // The first payday on or after fromDay that's in step with the anchor.
    let day = first;
    if (day < fromDay) day = addDays(day, Math.ceil((dayNumber(fromDay) - dayNumber(day)) / step) * step);
    for (; day <= toDay; day = addDays(day, step)) days.push(day);
  } else if (s.pay_schedule === "monthly" && s.pay_day !== null) {
    let [year, month] = fromDay.split("-").map(Number);
    for (;;) {
      const day = `${year}-${String(month).padStart(2, "0")}-${String(Math.min(s.pay_day, lastDayOfMonth(year, month))).padStart(2, "0")}`;
      if (day > toDay) break;
      if (day >= fromDay) days.push(day);
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }
  }
  return days;
}

// Payments can arrive a few days before the payday.
const EARLY_DAYS = 3;

// The first payday that passed more than the grace days ago with paid work done before it and no payment
// logged around it. lastPayment: the source's latest payment day (or null); paidWorkDays: days with paid
// hours, oldest first. null when nothing looks late.
export function latePayday(
  s: Schedule,
  { today, lastPayment, paidWorkDays, anchor }: { today: string; lastPayment: string | null; paidWorkDays: string[]; anchor?: string },
): { payday: string; workSince: string } | null {
  const work = paidWorkDays.filter((d) => !lastPayment || d > lastPayment);
  if (!work.length) return null;
  const from = lastPayment ? addDays(lastPayment, EARLY_DAYS + 1) : work[0];
  for (const payday of paydays(s, from, addDays(today, -s.grace_days), anchor)) {
    if (work[0] < payday) return { payday, workSince: work[0] };
  }
  return null;
}
