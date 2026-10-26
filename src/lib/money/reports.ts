// Numbers behind the documents (sprint 7): the income report by month, timesheet rows, and CSV for accountants.
// Relative imports with extensions, so `npm test` runs it directly with Node.
import { addDays, dayKey, startOfDay, timeKey } from "../app/time.ts";
import { entryHours } from "./realRate.ts";
import { round2 } from "./tax.ts";

export type ReportPayment = { received_on: string; source: string; amount: number; currency: string; brl: number | null };
export type IncomeMonth = { key: string; count: number; brl: number };

// "2026-08" … "2026-10", inclusive.
export function monthKeys(fromKey: string, toKey: string): string[] {
  const keys: string[] = [];
  for (let key = fromKey; key <= toKey && keys.length < 120; ) {
    keys.push(key);
    const [y, m] = key.split("-").map(Number);
    key = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  }
  return keys;
}

// Payments between two months, in reais: per month, the total, the monthly average over the whole period, and
// the payers from the largest. Payments without a rate (brl null) are counted apart and left out of the sums.
export function incomeReport<P extends ReportPayment>(payments: P[], fromKey: string, toKey: string) {
  const keys = monthKeys(fromKey, toKey);
  const inPeriod = payments.filter((p) => keys.includes(p.received_on.slice(0, 7)));
  const months: IncomeMonth[] = keys.map((key) => {
    const mine = inPeriod.filter((p) => p.received_on.startsWith(key));
    return { key, count: mine.length, brl: round2(mine.reduce((sum, p) => sum + (p.brl ?? 0), 0)) };
  });
  const total = round2(months.reduce((sum, m) => sum + m.brl, 0));
  const bySource = new Map<string, number>();
  for (const p of inPeriod) bySource.set(p.source, (bySource.get(p.source) ?? 0) + (p.brl ?? 0));
  return {
    months,
    total,
    average: keys.length ? round2(total / keys.length) : 0,
    monthsWithIncome: months.filter((m) => m.count > 0).length,
    sources: [...bySource].sort((a, b) => b[1] - a[1]).map(([name]) => name),
    missing: inPeriod.filter((p) => p.brl === null).length,
    payments: [...inPeriod].sort((a, b) => a.received_on.localeCompare(b.received_on)),
  };
}

export type SheetEntry = { started_at: string; ended_at: string | null; kind: "paid" | "unpaid"; label: string | null };
export type SheetRow = { day: string; start: string; end: string | null; hours: number; kind: "paid" | "unpaid"; label: string | null };

// Entries that touch a period (days on the person's clock), oldest first, with hours clipped to the period
// (the same hours the "possível diferença" check uses). A running entry counts up to now.
export function timesheetRows(
  entries: SheetEntry[],
  { fromDay, toDay, timeZone, now, paidOnly = false }: { fromDay: string; toDay: string; timeZone: string; now: number; paidOnly?: boolean },
) {
  const from = startOfDay(fromDay, timeZone).getTime();
  const to = startOfDay(addDays(toDay, 1), timeZone).getTime();
  const rows: SheetRow[] = entries
    .filter((e) => !paidOnly || e.kind === "paid")
    .map((e) => ({ e, hours: entryHours(e, Math.min(now, to), from) }))
    .filter(({ hours }) => hours > 0)
    .sort((a, b) => a.e.started_at.localeCompare(b.e.started_at))
    .map(({ e, hours }) => {
      const start = new Date(e.started_at);
      return {
        day: dayKey(start, timeZone),
        start: timeKey(start, timeZone),
        end: e.ended_at ? timeKey(new Date(e.ended_at), timeZone) : null,
        hours,
        kind: e.kind,
        label: e.label,
      };
    });
  const paidHours = rows.filter((r) => r.kind === "paid").reduce((sum, r) => sum + r.hours, 0);
  const unpaidHours = rows.filter((r) => r.kind === "unpaid").reduce((sum, r) => sum + r.hours, 0);
  return { rows, paidHours, unpaidHours, totalHours: paidHours + unpaidHours };
}

// A CSV that opens in Excel in either language: Portuguese uses ";" between fields and a decimal comma (how a
// Brazilian Excel reads CSV); English uses "," and a decimal point. A BOM keeps accents right.
export function toCsv(rows: (string | number | null)[][], lang: "pt" | "en"): string {
  const sep = lang === "pt" ? ";" : ",";
  const cell = (v: string | number | null) => {
    if (v === null) return "";
    const text = typeof v === "number" ? (lang === "pt" ? String(v).replace(".", ",") : String(v)) : v;
    return /["\n\r]/.test(text) || text.includes(sep) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return "﻿" + rows.map((r) => r.map(cell).join(sep)).join("\r\n") + "\r\n";
}
