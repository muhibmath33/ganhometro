// Money received (feature 2 with real payments, feature 3, and the monthly take-home).
// Payments cover a period of work in calendar days; entries are instants. Relative imports with
// extensions, so `npm test` runs it directly with Node.
import { addDays, startOfDay } from "../app/time.ts";
import { entryHours, type RateEntry, type RateProject, type RateSource } from "./realRate.ts";
import { companyMonth, individualMonth, type InssPlan, round2 } from "./tax.ts";

export type PaymentLite = {
  amount: number; // what the client or platform paid, before the platform's commission
  received_on: string;
  period_start: string | null;
  period_end: string | null;
};

const dayNumber = (day: string) => Date.parse(`${day}T00:00:00Z`) / 86_400_000;
const maxDay = (a: string, b: string) => (a > b ? a : b);
const minDay = (a: string, b: string) => (a < b ? a : b);

function periodOf(p: PaymentLite): [string, string] {
  return [p.period_start ?? p.received_on, p.period_end ?? p.received_on];
}

// The share of a payment's work period that falls between two days (inclusive), by calendar days.
export function periodShare(p: PaymentLite, fromDay: string, toDay: string): number {
  const [start, end] = periodOf(p);
  const from = maxDay(start, fromDay);
  const to = minDay(end, toDay);
  if (to < from) return 0;
  return (dayNumber(to) - dayNumber(from) + 1) / (dayNumber(end) - dayNumber(start) + 1);
}

// Hours of entries inside [fromDay, toDay] on the user's clock.
function hoursBetween(entries: RateEntry[], fromDay: string, toDay: string, timeZone: string, now: number, kind?: RateEntry["kind"]) {
  const from = startOfDay(fromDay, timeZone).getTime();
  const to = startOfDay(addDays(toDay, 1), timeZone).getTime();
  return entries
    .filter((e) => !kind || e.kind === kind)
    .reduce((sum, e) => sum + entryHours(e, Math.min(now, to), from), 0);
}

// Work periods for payments that don't say which work they pay for: from the day after the previous
// payment's period to the day received. A source's first payment starts at its first logged hour.
// days must be sorted, oldest first.
export function defaultPeriods(previousEnd: string | null, firstWorkDay: string | null, days: string[]): [string, string][] {
  let prev = previousEnd;
  return days.map((day) => {
    let start = prev ? addDays(prev, 1) : firstWorkDay && firstWorkDay <= day ? firstWorkDay : day;
    if (start > day) start = day;
    prev = day;
    return [start, day];
  });
}

export type ReceivedSummary = {
  earned: number; // money received for work in the period, after commission, in the source's currency
  coveredHours: number; // hours worked in the days those payments cover
  uncoveredHours: number; // hours worked in the period that no payment covers yet
  realRate: number | null; // earned ÷ covered hours
};

// Real rate from money received, for one source between two days.
export function receivedSummary(
  source: RateSource,
  entries: RateEntry[],
  payments: PaymentLite[],
  { fromDay, toDay, timeZone, now }: { fromDay: string; toDay: string; timeZone: string; now: number },
): ReceivedSummary {
  const keep = 1 - (source.commission_pct ?? 0) / 100;
  let earned = 0;
  const intervals: [string, string][] = [];
  for (const p of payments) {
    const share = periodShare(p, fromDay, toDay);
    if (share <= 0) continue;
    earned += p.amount * keep * share;
    const [start, end] = periodOf(p);
    intervals.push([maxDay(start, fromDay), minDay(end, toDay)]);
  }
  // Merge overlapping or adjacent periods so no hour is counted twice.
  intervals.sort((a, b) => a[0].localeCompare(b[0]));
  const merged: [string, string][] = [];
  for (const [a, b] of intervals) {
    const last = merged[merged.length - 1];
    if (last && a <= addDays(last[1], 1)) last[1] = maxDay(last[1], b);
    else merged.push([a, b]);
  }
  const coveredHours = merged.reduce((sum, [a, b]) => sum + hoursBetween(entries, a, b, timeZone, now), 0);
  const totalHours = hoursBetween(entries, fromDay, toDay, timeZone, now);
  return {
    earned,
    coveredHours,
    uncoveredHours: Math.max(0, totalHours - coveredHours),
    realRate: coveredHours > 0 ? earned / coveredHours : null,
  };
}

export type Underpayment = { expected: number; difference: number; flagged: boolean };

// "Possível diferença": paid hours (or tasks) in a payment's period × the rate, minus what was paid.
// Flagged only above the larger of 2 (in the source's currency) or 3% of the expected amount.
// Projects with their own hourly rate use it; fixed-price projects and retainers aren't checked by the hour.
// A payment toward an invoice isn't either: the invoice shows what's left on it.
export function checkUnderpayment(
  source: RateSource,
  payment: PaymentLite & { project_id?: string | null; invoice_id?: string | null },
  entries: (RateEntry & { project_id?: string | null })[],
  { timeZone, now, projects = [] }: { timeZone: string; now: number; projects?: Pick<RateProject, "id" | "pay_model" | "rate">[] },
): Underpayment | null {
  if (source.pay_model === "retainer" || payment.invoice_id || !payment.period_start || !payment.period_end) return null;
  const projectOf = (id: string | null | undefined) => projects.find((p) => p.id === id);
  const forProject = projectOf(payment.project_id);
  if (forProject?.pay_model === "fixed") return null;
  // A payment for a project covers that project's hours; otherwise every hour not in a fixed-price project.
  const mine = entries.filter((e) =>
    forProject ? e.project_id === forProject.id : projectOf(e.project_id)?.pay_model !== "fixed",
  );
  const from = startOfDay(payment.period_start, timeZone).getTime();
  const to = startOfDay(addDays(payment.period_end, 1), timeZone).getTime();
  let expected = 0;
  let units = 0;
  for (const e of mine) {
    if (e.kind !== "paid") continue;
    const project = projectOf(e.project_id);
    if (project?.pay_model === "hourly" && project.rate !== null) {
      expected += entryHours(e, Math.min(now, to), from) * project.rate;
    } else if (source.pay_model === "fixed" || source.rate === null) {
      return null;
    } else if (source.pay_model === "hourly") {
      expected += entryHours(e, Math.min(now, to), from) * source.rate;
    } else if (Date.parse(e.started_at) >= from && Date.parse(e.started_at) < to) {
      units += e.units ?? 0;
    }
  }
  if (source.pay_model === "per_task" && source.rate !== null) {
    if (!units && expected === 0) return null;
    expected += units * source.rate;
  }
  if (expected <= 0) return null;
  const difference = round2(expected - payment.amount);
  return { expected: round2(expected), difference, flagged: difference > Math.max(2, expected * 0.03) };
}

export type TaxProfile = { tax_mode: "pf" | "cnpj"; inss_plan: InssPlan; dependents: number; accountant_cost: number };

export type PaymentMoney = {
  taxBrl: number | null; // in reais by the carnê-leão rule
  marketBrl: number | null; // in reais at the day's rate
  arrivedBrl: number | null; // what reached the Brazilian account, when the person entered it
  commissionPct: number;
};

export type TakeHome = {
  received: number;
  commission: number;
  fees: number; // fees and exchange spread, from payments whose reais arrived are known
  feesUnknown: number; // payments without the reais that arrived
  missingRates: number; // payments that couldn't be converted (no rate yet)
  taxBase: number;
  inss: number;
  tax: number; // carnê-leão (individual) or DAS + IR on the pro-labore (company)
  das: number;
  proLaboreTax: number;
  accountant: number;
  kept: number;
};

// The month's take-home: what was received, minus platform commission, fees and exchange, INSS and tax.
export function monthTakeHome(payments: PaymentMoney[], profile: TaxProfile): TakeHome {
  let received = 0;
  let commission = 0;
  let fees = 0;
  let feesUnknown = 0;
  let missingRates = 0;
  let taxBase = 0;
  for (const p of payments) {
    const value = p.marketBrl ?? p.taxBrl;
    if (value === null || p.taxBrl === null) {
      missingRates++;
      continue;
    }
    const cut = value * (p.commissionPct / 100);
    received += value;
    commission += cut;
    taxBase += p.taxBrl;
    if (p.arrivedBrl === null) feesUnknown++;
    else fees += value - cut - p.arrivedBrl;
  }
  let inss = 0;
  let tax = 0;
  let das = 0;
  let proLaboreTax = 0;
  let accountant = 0;
  if (profile.tax_mode === "cnpj") {
    const company = companyMonth(taxBase, { accountant: profile.accountant_cost });
    if (company) {
      das = company.das;
      inss = company.inss;
      proLaboreTax = company.irrf;
      accountant = company.accountant;
      tax = das + proLaboreTax;
    }
  } else {
    const person = individualMonth(taxBase, { inss: profile.inss_plan, dependents: profile.dependents });
    inss = person.inss;
    tax = person.tax;
  }
  const kept = received - commission - fees - inss - tax - accountant;
  return {
    received: round2(received),
    commission: round2(commission),
    fees: round2(fees),
    feesUnknown,
    missingRates,
    taxBase: round2(taxBase),
    inss,
    tax: round2(tax),
    das,
    proLaboreTax,
    accountant,
    kept: round2(kept),
  };
}
