// The data behind each document, for the pages that preview them and the routes that download them.
// userId is filtered explicitly, like the other loaders.
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { categoryName } from "@/i18n/app";
import type { DocLang } from "@/i18n/documents";
import type { Profile } from "@/lib/app/session";
import { loadTaxYear } from "@/lib/app/taxes";
import { addDays, startOfDay } from "@/lib/app/time";
import { carneLeaoRate, toTaxBrl } from "@/lib/money/convert";
import { loadRates } from "@/lib/money/rates";
import { checkUnderpayment, periodShare } from "@/lib/money/received";
import { incomeReport, monthKeys, timesheetRows } from "@/lib/money/reports";
import type { Database } from "@/lib/supabase/database.types";
import type { IncomeRow, Party, ReviewNumbers } from "./pdf";

type Supabase = SupabaseClient<Database>;

export const holderOf = (profile: Profile): Party => ({ name: profile.doc_name, details: profile.doc_details });

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
export const isMonthKey = (v: unknown): v is string => typeof v === "string" && MONTH.test(v);

// Payments received between two months, each in reais by the carnê-leão rule, with the rate used.
export async function loadIncome(supabase: Supabase, profile: Profile, userId: string, fromKey: string, toKey: string, today: string) {
  const first = `${fromKey}-01`;
  const keys = monthKeys(fromKey, toKey);
  const last = addDays(`${keys.length ? nextMonth(toKey) : fromKey}-01`, -1);
  const { data } = await supabase
    .from("payments")
    .select("amount, currency, received_on, amount_brl_received, method, income_sources(name)")
    .eq("user_id", userId)
    .gte("received_on", first)
    .lte("received_on", last)
    .order("received_on");
  const payments = data ?? [];
  const book = await loadRates(supabase, payments.map((p) => p.currency), first, last);
  const rows: (IncomeRow & { arrivedBrl: number | null; method: string | null })[] = payments.map((p) => {
    const amount = Number(p.amount);
    const brl = toTaxBrl(book, amount, p.currency, p.received_on);
    const [y, m] = p.received_on.split("-").map(Number);
    const rule = p.currency === "BRL" ? null : carneLeaoRate(book, y, m);
    return {
      received_on: p.received_on,
      source: p.income_sources?.name ?? "",
      amount,
      currency: p.currency,
      brl: brl === null ? null : Math.round(brl * 100) / 100,
      rate: brl !== null && p.currency !== "BRL" ? brl / amount : null,
      rateDay: rule?.day ?? null,
      arrivedBrl: p.amount_brl_received === null ? null : Number(p.amount_brl_received),
      method: p.method,
    };
  });
  // The month's tax estimate and payment date, from the Taxes screens.
  const years = [...new Set(keys.map((k) => Number(k.slice(0, 4))))];
  const taxYears = await Promise.all(years.map((year) => loadTaxYear(supabase, profile, userId, year, today)));
  const taxes = new Map<string, { amount: number; paidOn: string | null }>();
  for (const ty of taxYears) for (const m of ty.months) if (keys.includes(m.key)) taxes.set(m.key, { amount: m.amountDue, paidOn: m.paidOn });
  return { rows, report: incomeReport(rows, fromKey, toKey), taxes };
}

const nextMonth = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
};

export type SheetQuery = { sourceId: string; projectId: string | null; fromDay: string; toDay: string; paidOnly: boolean };

// A client's or platform's hours between two days (on the person's clock), optionally one project's.
// null when the source isn't the person's.
export async function loadTimesheet(supabase: Supabase, userId: string, timeZone: string, q: SheetQuery, lang: DocLang, now: number) {
  const from = startOfDay(q.fromDay, timeZone).toISOString();
  const to = startOfDay(addDays(q.toDay, 1), timeZone).toISOString();
  let entriesQuery = supabase
    .from("time_entries")
    .select("project_id, category_id, kind, units, started_at, ended_at")
    .eq("user_id", userId)
    .eq("source_id", q.sourceId)
    .lt("started_at", to)
    .or(`ended_at.gt.${from},ended_at.is.null`)
    .order("started_at");
  if (q.projectId) entriesQuery = entriesQuery.eq("project_id", q.projectId);
  const [{ data: source }, { data: projects }, { data: categories }, { data: entries }] = await Promise.all([
    supabase.from("income_sources").select("id, name, kind, pay_model, rate, currency, commission_pct, billing_details").eq("user_id", userId).eq("id", q.sourceId).maybeSingle(),
    supabase.from("projects").select("id, name, pay_model, rate").eq("user_id", userId).eq("source_id", q.sourceId),
    supabase.from("categories").select("id, name, preset").eq("user_id", userId),
    entriesQuery,
  ]);
  if (!source) return null;
  const project = (projects ?? []).find((p) => p.id === q.projectId) ?? null;
  const projectName = new Map((projects ?? []).map((p) => [p.id, p.name]));
  const catName = new Map((categories ?? []).map((c) => [c.id, categoryName(c, lang === "en" ? "en" : "pt-BR")]));
  const list = entries ?? [];
  const sheet = timesheetRows(
    list.map((e) => ({
      started_at: e.started_at,
      ended_at: e.ended_at,
      kind: e.kind,
      // Without a project filter, each row says its project; the category says what the time was.
      label: [!project && e.project_id ? projectName.get(e.project_id) : null, e.category_id ? catName.get(e.category_id) : null].filter(Boolean).join(" · ") || null,
    })),
    { fromDay: q.fromDay, toDay: q.toDay, timeZone, now, paidOnly: q.paidOnly },
  );
  return { source, project, projects: projects ?? [], entries: list, sheet };
}

// The payment review pack: the period's paid hours, what they come to at the rate, and what was received
// for the period (each payment's share of it).
export async function loadReview(supabase: Supabase, userId: string, timeZone: string, q: Omit<SheetQuery, "paidOnly">, lang: DocLang, now: number) {
  const data = await loadTimesheet(supabase, userId, timeZone, { ...q, paidOnly: true }, lang, now);
  if (!data) return null;
  const { source, project, projects } = data;
  let paymentsQuery = supabase
    .from("payments")
    .select("id, amount, currency, received_on, period_start, period_end, project_id")
    .eq("user_id", userId)
    .eq("source_id", q.sourceId)
    .gte("received_on", q.fromDay);
  if (q.projectId) paymentsQuery = paymentsQuery.eq("project_id", q.projectId);
  const { data: paymentRows } = await paymentsQuery;
  const payments = (paymentRows ?? []).map((p) => ({ ...p, amount: Number(p.amount) }));
  const received = Math.round(payments.reduce((sum, p) => sum + p.amount * periodShare(p, q.fromDay, q.toDay), 0) * 100) / 100;
  const rateSource = {
    pay_model: source.pay_model,
    rate: source.rate === null ? null : Number(source.rate),
    commission_pct: source.commission_pct === null ? null : Number(source.commission_pct),
  };
  const check = checkUnderpayment(
    rateSource,
    { amount: received, received_on: q.toDay, period_start: q.fromDay, period_end: q.toDay, project_id: q.projectId },
    data.entries,
    {
      timeZone,
      now,
      projects: projects.map((p) => ({
        id: p.id,
        pay_model: p.pay_model === "hourly" || p.pay_model === "fixed" ? p.pay_model : null,
        rate: p.rate === null ? null : Number(p.rate),
      })),
    },
  );
  const rate = project?.pay_model === "hourly" && project.rate !== null ? Number(project.rate) : source.pay_model === "hourly" ? rateSource.rate : null;
  const review: ReviewNumbers = {
    currency: source.currency,
    rate,
    expected: check?.expected ?? null,
    received,
    // Only a gap the payments list would flag ("possível diferença"); smaller ones aren't worth a review.
    difference: check?.flagged ? check.difference : null,
  };
  return { ...data, review, payments: payments.filter((p) => periodShare(p, q.fromDay, q.toDay) > 0) };
}
