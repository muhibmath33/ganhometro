// Invoices (Stage 1, sprint 6): state from the payments linked to them, numbering, and an amount from hours.
// Relative imports with extensions, so `npm test` runs it directly with Node.
import { addDays, startOfDay } from "../app/time.ts";
import { entryHours, type RateEntry } from "./realRate.ts";
import { round2 } from "./tax.ts";

export type InvoiceLite = { amount: number; due_on: string; status: "draft" | "sent" | "void" };
export type InvoiceState = "draft" | "void" | "open" | "partial" | "paid" | "overdue";

// paid: the sum of the payments linked to it. Overdue counts after the client's grace days.
export function invoiceState(invoice: InvoiceLite, paid: number, today: string, graceDays = 0): { state: InvoiceState; balance: number } {
  const balance = round2(Math.max(0, invoice.amount - paid));
  if (invoice.status === "void") return { state: "void", balance: 0 };
  if (invoice.status === "draft") return { state: "draft", balance };
  if (balance <= 0.01) return { state: "paid", balance: 0 };
  if (today > addDays(invoice.due_on, graceDays)) return { state: "overdue", balance };
  return { state: paid > 0 ? "partial" : "open", balance };
}

// "2026-001", "2026-002"… continuing the person's highest number for the year. Other formats are left alone.
export function nextInvoiceNumber(existing: string[], year: number): string {
  const prefix = `${year}-`;
  const highest = existing
    .filter((n) => n.startsWith(prefix))
    .map((n) => Number(n.slice(prefix.length)))
    .filter((n) => Number.isInteger(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefix}${String(highest + 1).padStart(3, "0")}`;
}

// What logged paid hours between two days come to at a rate (for "calculate from my hours").
export function amountFromHours(
  entries: RateEntry[],
  rate: number,
  { fromDay, toDay, timeZone, now }: { fromDay: string; toDay: string; timeZone: string; now: number },
): { hours: number; amount: number } {
  const from = startOfDay(fromDay, timeZone).getTime();
  const to = startOfDay(addDays(toDay, 1), timeZone).getTime();
  const hours = entries.filter((e) => e.kind === "paid").reduce((sum, e) => sum + entryHours(e, Math.min(now, to), from), 0);
  return { hours, amount: round2(hours * rate) };
}
