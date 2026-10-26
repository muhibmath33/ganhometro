// Invoices sent to clients: loading them with what's been paid on each, the form, and what's still owed.
// userId is filtered explicitly: the daily job uses the secret key, which bypasses Row Level Security.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppDictionary } from "@/i18n/app";
import { parseNumber } from "@/lib/calc";
import { type InvoiceState, invoiceState } from "@/lib/money/invoices";
import type { Database } from "@/lib/supabase/database.types";
import { CURRENCIES } from "./sources";
import { isDay } from "./time";

export type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
export type InvoiceError = keyof AppDictionary["invoices"]["errors"];
export type InvoiceStatus = "draft" | "sent" | "void";
export type InvoiceView = Omit<Invoice, "amount" | "status"> & {
  amount: number;
  status: InvoiceStatus;
  paid: number;
  state: InvoiceState;
  balance: number;
  sourceName: string;
  projectName: string | null;
};

export const INVOICE_STATUSES = ["draft", "sent", "void"] as const satisfies readonly InvoiceStatus[];
export const OPEN_STATES: readonly InvoiceState[] = ["open", "partial", "overdue"];

// Every invoice of the person, newest first, with the payments linked to it added up. Overdue counts after
// the client's grace days.
export async function loadInvoices(supabase: SupabaseClient<Database>, userId: string, today: string): Promise<InvoiceView[]> {
  const [{ data: rows }, { data: payments }, { data: sources }, { data: projects }] = await Promise.all([
    supabase.from("invoices").select("*").eq("user_id", userId).order("issued_on", { ascending: false }).order("number", { ascending: false }),
    supabase.from("payments").select("invoice_id, amount").eq("user_id", userId).not("invoice_id", "is", null),
    supabase.from("income_sources").select("id, name, grace_days").eq("user_id", userId),
    supabase.from("projects").select("id, name").eq("user_id", userId),
  ]);
  const paid = new Map<string, number>();
  for (const p of payments ?? []) if (p.invoice_id) paid.set(p.invoice_id, (paid.get(p.invoice_id) ?? 0) + Number(p.amount));
  const sourceById = new Map((sources ?? []).map((s) => [s.id, s]));
  const projectName = new Map((projects ?? []).map((p) => [p.id, p.name]));
  return (rows ?? []).map((row) => {
    const amount = Number(row.amount);
    const status = (INVOICE_STATUSES as readonly string[]).includes(row.status) ? (row.status as InvoiceStatus) : "sent";
    const source = sourceById.get(row.source_id);
    const sum = paid.get(row.id) ?? 0;
    const { state, balance } = invoiceState({ amount, due_on: row.due_on, status }, sum, today, source?.grace_days ?? 0);
    return {
      ...row,
      amount,
      status,
      paid: sum,
      state,
      balance,
      sourceName: source?.name ?? "",
      projectName: row.project_id ? (projectName.get(row.project_id) ?? null) : null,
    };
  });
}

// What's still owed on invoices, per currency, and how many are overdue.
export function owedSummary(invoices: InvoiceView[]) {
  const byCurrency = new Map<string, number>();
  let overdue = 0;
  for (const i of invoices) {
    if (!OPEN_STATES.includes(i.state)) continue;
    byCurrency.set(i.currency, (byCurrency.get(i.currency) ?? 0) + i.balance);
    if (i.state === "overdue") overdue++;
  }
  return { byCurrency, overdue };
}

const text = (value: FormDataEntryValue | null) => (typeof value === "string" ? value.trim() : "");

export type InvoiceFields = Pick<
  Invoice,
  "source_id" | "project_id" | "number" | "issued_on" | "due_on" | "amount" | "currency" | "period_start" | "period_end" | "status"
>;

export function parseInvoiceForm(form: FormData): { data: InvoiceFields } | { error: InvoiceError } {
  const sourceId = text(form.get("source_id"));
  if (!sourceId) return { error: "source" };
  const number = text(form.get("number"));
  if (number.length < 1 || number.length > 30) return { error: "number" };
  const issued = text(form.get("issued_on"));
  const due = text(form.get("due_on"));
  if (!isDay(issued) || !isDay(due) || due < issued) return { error: "dates" };
  const amount = parseNumber(text(form.get("amount")));
  if (!(amount > 0) || amount > 10_000_000) return { error: "amount" };
  const start = text(form.get("period_start"));
  const end = text(form.get("period_end"));
  if ((start && !isDay(start)) || (end && !isDay(end))) return { error: "period" };
  if (start && end && end < start) return { error: "period" };
  const currency = text(form.get("currency"));
  const status = text(form.get("status"));
  return {
    data: {
      source_id: sourceId,
      project_id: text(form.get("project_id")) || null,
      number,
      issued_on: issued,
      due_on: due,
      amount: Math.round(amount * 100) / 100,
      currency: (CURRENCIES as readonly string[]).includes(currency) ? currency : "USD",
      period_start: start || null,
      period_end: end || (start ? issued : null),
      status: (INVOICE_STATUSES as readonly string[]).includes(status) ? status : "sent",
    },
  };
}

// Clients for the invoice form, with their payment terms and active projects. `keep` adds back an
// archived client or project the invoice already uses.
export async function loadInvoiceSources(
  supabase: SupabaseClient<Database>,
  userId: string,
  keep: { sourceId?: string; projectId?: string | null } = {},
) {
  const [{ data: sources }, { data: projects }] = await Promise.all([
    supabase.from("income_sources").select("id, name, currency, payment_terms_days, archived_at").eq("user_id", userId).order("created_at"),
    supabase.from("projects").select("id, source_id, name, pay_model, fixed_price, archived_at").eq("user_id", userId).order("created_at"),
  ]);
  return (sources ?? [])
    .filter((s) => !s.archived_at || s.id === keep.sourceId)
    .map((s) => ({
      id: s.id,
      name: s.name,
      currency: s.currency,
      terms: s.payment_terms_days,
      projects: (projects ?? [])
        .filter((p) => p.source_id === s.id && (!p.archived_at || p.id === keep.projectId))
        .map((p) => ({ id: p.id, name: p.name, fixedPrice: p.pay_model === "fixed" && p.fixed_price !== null ? Number(p.fixed_price) : null })),
    }));
}

// Sources for the payment form, each with its active projects and open invoices. `keep` adds back what a
// payment being edited already uses (an archived source or project, a settled invoice).
export async function loadPaymentSources(
  supabase: SupabaseClient<Database>,
  userId: string,
  today: string,
  keep: { sourceId?: string; projectId?: string | null; invoiceId?: string | null } = {},
) {
  const [sources, invoices] = await Promise.all([loadInvoiceSources(supabase, userId, keep), loadInvoices(supabase, userId, today)]);
  return sources.map((s) => ({
    id: s.id,
    name: s.name,
    currency: s.currency,
    projects: s.projects.map((p) => ({ id: p.id, name: p.name })),
    invoices: invoices
      .filter((i) => i.source_id === s.id && (OPEN_STATES.includes(i.state) || i.id === keep.invoiceId))
      .map((i) => ({ id: i.id, number: i.number, currency: i.currency, balance: i.balance, projectId: i.project_id })),
  }));
}
