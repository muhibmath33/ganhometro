// Validation and helpers for payments received.
import type { AppDictionary } from "@/i18n/app";
import { parseNumber } from "@/lib/calc";
import type { Database } from "@/lib/supabase/database.types";
import { CURRENCIES } from "./sources";
import { addDays, isDay } from "./time";

export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type PaymentError = keyof AppDictionary["payment"]["errors"];

export const METHODS = ["wise", "payoneer", "paypal", "husky", "remessa", "nomad", "deel", "upwork", "bank", "pix", "airtm", "other"] as const;
export type Method = (typeof METHODS)[number];

const text = (value: FormDataEntryValue | null) => (typeof value === "string" ? value.trim() : "");

export type PaymentFields = {
  source_id: string;
  amount: number;
  currency: string;
  received_on: string;
  method: Method | null;
  amount_brl_received: number | null;
  period_start: string | null;
  period_end: string | null;
};

// Reads the payment form. today is the user's date ("2026-10-27"); a day ahead is allowed for time zones.
export function parsePaymentForm(form: FormData, today: string): { data: PaymentFields } | { error: PaymentError } {
  const sourceId = text(form.get("source_id"));
  if (!sourceId) return { error: "source" };
  const amount = parseNumber(text(form.get("amount")));
  if (!(amount > 0) || amount > 10_000_000) return { error: "amount" };
  const receivedOn = text(form.get("received_on"));
  if (!isDay(receivedOn)) return { error: "date" };
  if (receivedOn > addDays(today, 1)) return { error: "future" };

  const brlText = text(form.get("amount_brl_received"));
  const brl = brlText === "" ? null : parseNumber(brlText);
  if (brl !== null && !(brl >= 0 && brl <= 100_000_000)) return { error: "brl" };

  const start = text(form.get("period_start"));
  const end = text(form.get("period_end"));
  if ((start && !isDay(start)) || (end && !isDay(end))) return { error: "date" };
  const periodStart = start || null;
  const periodEnd = end || (start ? receivedOn : null);
  if (periodStart && periodEnd && periodEnd < periodStart) return { error: "period" };

  const method = text(form.get("method"));
  const currency = text(form.get("currency"));
  return {
    data: {
      source_id: sourceId,
      amount: Math.round(amount * 100) / 100,
      currency: (CURRENCIES as readonly string[]).includes(currency) ? currency : "USD",
      received_on: receivedOn,
      method: (METHODS as readonly string[]).includes(method) ? (method as Method) : null,
      amount_brl_received: brl === null ? null : Math.round(brl * 100) / 100,
      period_start: periodStart,
      period_end: periodEnd,
    },
  };
}
