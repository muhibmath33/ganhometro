// Payments in reais for the app's pages: the month's take-home, the dashboard and the payments list.
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type RateBook, toMarketBrl, toTaxBrl } from "@/lib/money/convert";
import { loadRates } from "@/lib/money/rates";
import { monthTakeHome, type PaymentMoney, type TakeHome, type TaxProfile } from "@/lib/money/received";
import type { ReserveSettings } from "@/lib/money/reserves";
import type { InssPlan } from "@/lib/money/tax";
import type { Database } from "@/lib/supabase/database.types";
import type { Payment } from "./payments";
import type { Profile } from "./session";
import { addDays } from "./time";

export function taxProfile(profile: Profile): TaxProfile {
  return {
    tax_mode: profile.tax_mode === "cnpj" ? "cnpj" : "pf",
    inss_plan: (["full", "simplified", "none"].includes(profile.inss_plan) ? profile.inss_plan : "full") as InssPlan,
    dependents: profile.dependents,
    accountant_cost: Number(profile.accountant_cost),
  };
}

export function reserveSettings(profile: Profile): ReserveSettings {
  return {
    salary: profile.salary_target === null ? null : Number(profile.salary_target),
    thirteenth: profile.reserve_13th,
    vacation: profile.reserve_vacation,
    emergencyPct: Number(profile.emergency_pct),
    emergencyMonths: profile.emergency_months,
  };
}

export function paymentMoney(p: Pick<Payment, "amount" | "currency" | "received_on" | "amount_brl_received">, book: RateBook, commissionPct: number): PaymentMoney {
  const amount = Number(p.amount);
  return {
    taxBrl: toTaxBrl(book, amount, p.currency, p.received_on),
    marketBrl: toMarketBrl(book, amount, p.currency, p.received_on),
    arrivedBrl: p.amount_brl_received === null ? null : Number(p.amount_brl_received),
    commissionPct,
  };
}

// "2026-10" → first and last day of that month.
export function monthBounds(year: number, month: number): [string, string] {
  const first = `${year}-${String(month).padStart(2, "0")}-01`;
  return [first, addDays(`${month === 12 ? year + 1 : year}-${String((month % 12) + 1).padStart(2, "0")}-01`, -1)];
}

// Loaders filter by userId explicitly: pages also have Row Level Security, but the background jobs use the
// secret key, which bypasses it.
export async function monthSummary(
  supabase: SupabaseClient<Database>,
  profile: Profile,
  userId: string,
  year: number,
  month: number,
): Promise<{ takeHome: TakeHome; count: number }> {
  const key = `${year}-${String(month).padStart(2, "0")}`;
  const [history] = await takeHomeHistory(supabase, profile, userId, key, key);
  return { takeHome: history.takeHome, count: history.count };
}

// The take-home of every month from one to another ("2026-01" to "2026-10"), oldest first, with one query
// for the payments and one for the rates.
export async function takeHomeHistory(
  supabase: SupabaseClient<Database>,
  profile: Profile,
  userId: string,
  fromKey: string,
  toKey: string,
): Promise<{ key: string; takeHome: TakeHome; count: number }[]> {
  const first = `${fromKey}-01`;
  const last = monthBounds(Number(toKey.slice(0, 4)), Number(toKey.slice(5, 7)))[1];
  const { data } = await supabase
    .from("payments")
    .select("amount, currency, received_on, amount_brl_received, income_sources(commission_pct)")
    .eq("user_id", userId)
    .gte("received_on", first)
    .lte("received_on", last);
  const payments = data ?? [];
  const book = await loadRates(supabase, payments.map((p) => p.currency), first, last);
  const months: string[] = [];
  for (let key = fromKey; key <= toKey; ) {
    months.push(key);
    const [y, m] = key.split("-").map(Number);
    key = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  }
  const profileForTax = taxProfile(profile);
  return months.map((key) => {
    const mine = payments.filter((p) => p.received_on.startsWith(key));
    const money = mine.map((p) => paymentMoney(p, book, Number(p.income_sources?.commission_pct ?? 0)));
    return { key, takeHome: monthTakeHome(money, profileForTax), count: mine.length };
  });
}
