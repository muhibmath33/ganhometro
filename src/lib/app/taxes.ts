// The Taxes screens' data: a year of payments in reais by the carnê-leão rule, the person's monthly tax
// details, what to pay and when, and how the other way of being paid would compare.
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toTaxBrl } from "@/lib/money/convert";
import { loadRates } from "@/lib/money/rates";
import {
  type CarneLeaoMonth,
  carneLeaoYear,
  type CompanyMonth,
  companyBreakEven,
  companyMonthAt,
  compareMonths,
  type DueStatus,
  dueStatus,
  inssSelfEmployed,
  nextMonthDueDate,
  rbt12At,
  RULES_2026,
} from "@/lib/money/tax";
import type { Database } from "@/lib/supabase/database.types";
import { taxProfile } from "./money";
import { addDays } from "./time";
import type { Profile } from "./session";

export type TaxMonthRow = {
  month: number; // 1–12
  key: string; // "2026-10"
  gross: number;
  payments: number;
  // Individual (carnê-leão)
  inss: number;
  inssEstimated: boolean;
  dependents: number;
  alimony: number;
  other: number;
  carneLeao: CarneLeaoMonth;
  inssDue: string;
  // Company (Simples Nacional)
  rbt12: number;
  company: CompanyMonth | null;
  // What to pay for this month, by when, and whether it's done
  amountDue: number;
  due: string;
  paidOn: string | null;
  status: DueStatus;
};

export type TaxYear = {
  year: number;
  mode: "pf" | "cnpj";
  months: TaxMonthRow[]; // up to the current month for the current year
  missingRates: number;
  comparison: { individual: number; company: number; savings: number };
  breakEven: number | null;
  monthsOfHistory: number; // months with income among the last 12
};

const key = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}`;

export async function loadTaxYear(supabase: SupabaseClient<Database>, profile: Profile, year: number, today: string): Promise<TaxYear> {
  const tp = taxProfile(profile);
  // Last year too: a company's tax bracket depends on the 12 months before each month.
  const from = `${year - 1}-01-01`;
  const to = `${year}-12-31`;
  const [{ data: paymentRows }, { data: detailRows }] = await Promise.all([
    supabase.from("payments").select("amount, currency, received_on").gte("received_on", from).lte("received_on", to),
    supabase.from("tax_months").select("*").gte("month", `${year}-01-01`).lte("month", `${year}-12-01`),
  ]);
  const payments = paymentRows ?? [];
  const book = await loadRates(supabase, payments.map((p) => p.currency), from, to < today ? to : today);

  // Income per month, from January of last year (index 0) to December of this year (index 23).
  const income = Array<number>(24).fill(0);
  const counts = Array<number>(24).fill(0);
  let missingRates = 0;
  for (const p of payments) {
    const brl = toTaxBrl(book, Number(p.amount), p.currency, p.received_on);
    const index = (Number(p.received_on.slice(0, 4)) - (year - 1)) * 12 + Number(p.received_on.slice(5, 7)) - 1;
    if (brl === null) missingRates++;
    else income[index] += brl;
    counts[index]++;
  }

  const details = new Map((detailRows ?? []).map((d) => [d.month.slice(0, 7), d]));
  const lastMonth = Number(today.slice(0, 4)) > year ? 12 : Number(today.slice(0, 4)) < year ? 0 : Number(today.slice(5, 7));
  const yearIncome = income.slice(12);
  const deductions = yearIncome.map((gross, i) => {
    const d = details.get(key(year, i + 1));
    const inss = d?.inss_paid !== null && d?.inss_paid !== undefined ? Number(d.inss_paid) : inssSelfEmployed(gross, tp.inss_plan);
    const dependents = d?.dependents ?? tp.dependents;
    const alimony = Number(d?.alimony ?? 0);
    const other = Number(d?.other_deductions ?? 0);
    return { inss, inssEstimated: d?.inss_paid === null || d?.inss_paid === undefined, dependents, alimony, other, legal: inss + dependents * RULES_2026.perDependent + alimony + other };
  });
  const carne = carneLeaoYear(year, yearIncome.map((gross, i) => ({ gross, legal: deductions[i].legal })));

  const months: TaxMonthRow[] = [];
  for (let i = 0; i < lastMonth; i++) {
    const month = i + 1;
    const gross = Math.round(yearIncome[i] * 100) / 100;
    const rbt12 = rbt12At(income, 12 + i);
    const company = companyMonthAt(gross, rbt12, { accountant: tp.accountant_cost });
    const paidOn = details.get(key(year, month))?.paid_on ?? null;
    const amountDue = tp.tax_mode === "cnpj" ? (company && gross > 0 ? company.das + company.inss + company.irrf : 0) : carne[i].darf;
    const due = tp.tax_mode === "cnpj" ? nextMonthDueDate(year, month, 20) : carne[i].due;
    months.push({
      month,
      key: key(year, month),
      gross,
      payments: counts[12 + i],
      ...deductions[i],
      carneLeao: carne[i],
      inssDue: nextMonthDueDate(year, month, 15),
      rbt12,
      company,
      amountDue,
      due,
      paidOn,
      status: dueStatus(amountDue, due, today, paidOn),
    });
  }

  // The last 12 months up to this month, for the individual-or-company comparison.
  const end = 12 + Math.max(lastMonth, 1) - 1;
  const rolling = income.slice(end - 11, end + 1);
  const options = { inss: tp.inss_plan, dependents: tp.dependents, accountant: tp.accountant_cost };
  return {
    year,
    mode: tp.tax_mode,
    months,
    missingRates,
    comparison: compareMonths(rolling, options),
    breakEven: companyBreakEven(options),
    monthsOfHistory: rolling.filter((x) => x > 0).length,
  };
}

// Months whose payment is due within a week, or late by up to 60 days. Older unpaid months stay marked
// "late" in the list without a banner: people often log past months they already paid outside the app.
export function dueReminders(taxYear: TaxYear, today: string) {
  return taxYear.months.filter((m) => m.status === "soon" || (m.status === "overdue" && m.due >= addDays(today, -60)));
}
