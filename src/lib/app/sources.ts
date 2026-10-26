// Validation and display helpers for income sources (platforms and clients).
import type { AppDictionary } from "@/i18n/app";
import type { Locale } from "@/i18n/config";
import { formatMoney, parseNumber } from "@/lib/calc";
import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];
export type Source = Database["public"]["Tables"]["income_sources"]["Row"];
export type SourceInput = Database["public"]["Tables"]["income_sources"]["Insert"];
export type SourceError = keyof AppDictionary["source"]["errors"];

export const KINDS = ["platform", "client"] as const satisfies readonly Enums["source_kind"][];
export const PAY_MODELS = ["hourly", "per_task", "fixed", "retainer"] as const satisfies readonly Enums["pay_model"][];
export const SCHEDULES = ["weekly", "biweekly", "monthly", "on_invoice", "irregular"] as const satisfies readonly Enums["pay_schedule"][];
export const CURRENCIES = ["USD", "EUR", "GBP", "BRL"] as const;
export const WORK_TYPES = ["ai", "freelancer", "teacher", "creator", "other"] as const satisfies readonly Enums["work_type"][];

const SYMBOLS: Record<string, string> = { USD: "US$", EUR: "€", GBP: "£", BRL: "R$" };
export const currencySymbol = (currency: string) => SYMBOLS[currency] ?? currency;

const pick = <T extends string>(value: FormDataEntryValue | null, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

const optionalNumber = (value: FormDataEntryValue | null): number | null => {
  const text = typeof value === "string" ? value.trim() : "";
  return text === "" ? null : parseNumber(text);
};

// Reads the source fields of a form. Returns the row to save, or the first error.
export function parseSourceForm(form: FormData): { data: SourceInput } | { error: SourceError } {
  const name = String(form.get("name") ?? "").trim();
  if (name.length < 1 || name.length > 60) return { error: "name" };

  const kind = pick(form.get("kind"), KINDS, "platform");
  const payModel = pick(form.get("pay_model"), PAY_MODELS, "hourly");
  const schedule = pick(form.get("pay_schedule"), SCHEDULES, kind === "client" ? "on_invoice" : "weekly");

  let rate: number | null = null;
  if (payModel !== "fixed") {
    rate = optionalNumber(form.get("rate"));
    // A retainer's rate is the monthly amount, so it can be larger.
    const max = payModel === "retainer" ? 9_999_999 : 99_999;
    if (rate === null || !Number.isFinite(rate) || rate < 0 || rate > max) return { error: "rate" };
  }

  const commission = optionalNumber(form.get("commission_pct"));
  if (commission !== null && (commission < 0 || commission > 100)) return { error: "commission" };

  let payWeekday: number | null = null;
  let payDay: number | null = null;
  let terms: number | null = null;
  if (schedule === "weekly" || schedule === "biweekly") {
    payWeekday = Number(form.get("pay_weekday"));
    if (!Number.isInteger(payWeekday) || payWeekday < 0 || payWeekday > 6) return { error: "day" };
  } else if (schedule === "monthly") {
    payDay = Number(form.get("pay_day"));
    if (!Number.isInteger(payDay) || payDay < 1 || payDay > 31) return { error: "day" };
  } else if (schedule === "on_invoice") {
    terms = optionalNumber(form.get("payment_terms_days")) ?? 30;
    if (!Number.isInteger(terms) || terms < 0 || terms > 180) return { error: "day" };
  }

  return {
    data: {
      kind,
      name,
      pay_model: payModel,
      rate,
      currency: pick(form.get("currency"), CURRENCIES, "USD"),
      commission_pct: commission,
      pay_schedule: schedule,
      pay_weekday: payWeekday,
      pay_day: payDay,
      payment_terms_days: terms,
    },
  };
}

// "US$ 25,00/h · comissão 20%" in the user's language.
export function describeSource(source: Source, t: AppDictionary, locale: Locale): string {
  const parts: string[] = [];
  const symbol = currencySymbol(source.currency);
  if (source.pay_model === "fixed") parts.push(t.sources.fixed);
  else if (source.rate !== null)
    parts.push(
      formatMoney(symbol, Number(source.rate), locale) +
        (source.pay_model === "per_task" ? t.sources.perTask : source.pay_model === "retainer" ? t.sources.perMonth : t.sources.perHour),
    );
  if (source.commission_pct !== null && Number(source.commission_pct) > 0)
    parts.push(t.sources.commission.replace("{n}", String(Number(source.commission_pct))));
  parts.push(scheduleLabel(source, t));
  return parts.join(" · ");
}

export function scheduleLabel(source: Pick<Source, "pay_schedule" | "pay_weekday" | "pay_day" | "payment_terms_days">, t: AppDictionary): string {
  const base = t.source.schedules[source.pay_schedule];
  if ((source.pay_schedule === "weekly" || source.pay_schedule === "biweekly") && source.pay_weekday !== null)
    return `${base} (${t.source.weekdays[source.pay_weekday]})`;
  if (source.pay_schedule === "monthly" && source.pay_day !== null) return `${base} (${source.pay_day})`;
  if (source.pay_schedule === "on_invoice" && source.payment_terms_days !== null) return `${base} (${source.payment_terms_days}d)`;
  return base;
}
