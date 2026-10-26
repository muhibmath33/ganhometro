// Payments in reais for the app's pages: the month's take-home, the dashboard and the payments list.
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type RateBook, toMarketBrl, toTaxBrl } from "@/lib/money/convert";
import { loadRates } from "@/lib/money/rates";
import { monthTakeHome, type PaymentMoney, type TakeHome, type TaxProfile } from "@/lib/money/received";
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

export async function monthSummary(
  supabase: SupabaseClient<Database>,
  profile: Profile,
  year: number,
  month: number,
): Promise<{ takeHome: TakeHome; count: number }> {
  const [first, last] = monthBounds(year, month);
  const { data } = await supabase
    .from("payments")
    .select("amount, currency, received_on, amount_brl_received, income_sources(commission_pct)")
    .gte("received_on", first)
    .lte("received_on", last);
  const payments = data ?? [];
  const book = await loadRates(supabase, payments.map((p) => p.currency), first, last);
  const money = payments.map((p) => paymentMoney(p, book, Number(p.income_sources?.commission_pct ?? 0)));
  return { takeHome: monthTakeHome(money, taxProfile(profile)), count: payments.length };
}
