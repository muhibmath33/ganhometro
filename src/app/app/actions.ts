"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CATEGORY_PRESETS } from "@/i18n/app";
import { type EntryError, type EntryKind, MIN_TIMER_MS, parseEntryForm, parseKind, parseUnits } from "@/lib/app/entries";
import { METHODS, type Method, type PaymentError, parsePaymentForm } from "@/lib/app/payments";
import { CURRENCIES, parseSourceForm, type SourceError, WORK_TYPES } from "@/lib/app/sources";
import { addDays, dayKey, isDay } from "@/lib/app/time";
import { parseNumber } from "@/lib/calc";
import { defaultPeriods } from "@/lib/money/received";
import { getSession, requireUser } from "@/lib/app/session";
import { site } from "@/lib/site";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- Sign in (email code, no password) -------------------------------------------

export type SignInState = {
  step: "email" | "code";
  email: string;
  error?: "invalid_email" | "invalid_code" | "rate_limited" | "generic";
};

export async function requestCode(_prev: SignInState, form: FormData): Promise<SignInState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) return { step: "email", email, error: "invalid_email" };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      data: { locale: form.get("locale") === "en" ? "en" : "pt-BR" },
      emailRedirectTo: `${site.url}/app/auth/confirm`,
    },
  });
  if (error) return { step: "email", email, error: error.status === 429 ? "rate_limited" : "generic" };
  return { step: "code", email };
}

export async function verifyCode(_prev: SignInState, form: FormData): Promise<SignInState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const token = String(form.get("code") ?? "").replace(/\D/g, "");
  if (token.length !== 6) return { step: "code", email, error: "invalid_code" };
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { step: "code", email, error: error.status === 429 ? "rate_limited" : "invalid_code" };
  redirect("/app");
}

export async function signOut() {
  const { supabase } = await getSession();
  await supabase.auth.signOut();
  redirect("/app/entrar");
}

// --- Onboarding --------------------------------------------------------------------

export type FormState = { error?: SourceError | "freeLimit" | "generic"; ok?: boolean; savedAt?: number } | null;

const isFreeLimit = (message: string | undefined) => Boolean(message?.includes("free_source_limit"));

export async function completeOnboarding(_prev: FormState, form: FormData): Promise<FormState> {
  const { supabase, user, profile } = await requireUser({ onboarded: false });
  const work = WORK_TYPES.includes(form.get("work_type") as (typeof WORK_TYPES)[number])
    ? (form.get("work_type") as (typeof WORK_TYPES)[number])
    : "other";
  const parsed = parseSourceForm(form);
  if ("error" in parsed) return { error: parsed.error };

  // Preset time categories for this type of work, in the user's language (only once).
  const { count } = await supabase.from("categories").select("id", { count: "exact", head: true });
  if (!count) {
    const lang = profile.locale === "en" ? "en" : "pt";
    const rows = CATEGORY_PRESETS[work].map((c, i) => ({ kind: c.kind, name: c[lang], preset: c.preset, sort: i }));
    const { error } = await supabase.from("categories").insert(rows);
    if (error) return { error: "generic" };
  }

  const { error: sourceError } = await supabase.from("income_sources").insert(parsed.data);
  if (sourceError) return { error: isFreeLimit(sourceError.message) ? "freeLimit" : "generic" };

  const { error } = await supabase
    .from("profiles")
    .update({ work_type: work, onboarded_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) return { error: "generic" };
  redirect("/app");
}

// --- Platforms and clients ---------------------------------------------------------

export async function saveSource(_prev: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const parsed = parseSourceForm(form);
  if ("error" in parsed) return { error: parsed.error };
  const id = String(form.get("id") ?? "");
  const { error } = id
    ? await supabase.from("income_sources").update(parsed.data).eq("id", id)
    : await supabase.from("income_sources").insert(parsed.data);
  if (error) return { error: isFreeLimit(error.message) ? "freeLimit" : "generic" };
  revalidatePath("/app", "layout");
  if (id) redirect("/app/fontes");
  return { ok: true, savedAt: Date.now() };
}

export async function setSourceArchived(form: FormData) {
  const { supabase } = await requireUser();
  const id = String(form.get("id") ?? "");
  const archive = form.get("archive") === "1";
  const { error } = await supabase
    .from("income_sources")
    .update({ archived_at: archive ? new Date().toISOString() : null })
    .eq("id", id);
  revalidatePath("/app", "layout");
  redirect(error && isFreeLimit(error.message) ? "/app/fontes?limite=1" : "/app/fontes");
}

// --- Timer ---------------------------------------------------------------------------
// The running entry lives on the server (ended_at = null), so it survives closing the tab or
// switching phones. The database allows one running entry per user and no overlaps.

export type TimerState = { error?: "generic" } | null;

type Supabase = Awaited<ReturnType<typeof requireUser>>["supabase"];

// A category must be one of the user's (RLS) and of the same kind as the entry.
async function categoryFits(supabase: Supabase, categoryId: string | null, kind: EntryKind) {
  if (!categoryId) return true;
  const { data } = await supabase.from("categories").select("kind").eq("id", categoryId).maybeSingle();
  return data?.kind === kind;
}

export async function startTimer(_prev: TimerState, form: FormData): Promise<TimerState> {
  const { supabase } = await requireUser();
  const kind = parseKind(form.get("kind"));
  const categoryId = String(form.get("category_id") ?? "") || null;
  if (!(await categoryFits(supabase, categoryId, kind))) return { error: "generic" };
  const { error } = await supabase.from("time_entries").insert({
    source_id: String(form.get("source_id") ?? ""),
    kind,
    category_id: categoryId,
    started_at: new Date().toISOString(),
    origin: "timer",
  });
  // 23505: a timer is already running (started on another device). Showing that one is the right outcome.
  if (error && error.code !== "23505") return { error: "generic" };
  revalidatePath("/app", "layout");
  return null;
}

// Paid ↔ unpaid, or another category: ends the running entry and starts the next one at the same instant.
// `target` is "kind:categoryId".
export async function switchTimer(_prev: TimerState, form: FormData): Promise<TimerState> {
  const { supabase } = await requireUser();
  const [kindText, categoryText = ""] = String(form.get("target") ?? "").split(":");
  const kind = parseKind(kindText);
  const categoryId = categoryText || null;
  const units = parseUnits(form.get("units"));
  const { data: running } = await supabase
    .from("time_entries")
    .select("id, source_id, started_at")
    .is("ended_at", null)
    .maybeSingle();
  if (running && (await categoryFits(supabase, categoryId, kind))) {
    const now = new Date();
    if (now.getTime() - Date.parse(running.started_at) < MIN_TIMER_MS) {
      const { error } = await supabase.from("time_entries").update({ kind, category_id: categoryId }).eq("id", running.id);
      if (error) return { error: "generic" };
    } else {
      const { error } = await supabase
        .from("time_entries")
        .update({ ended_at: now.toISOString(), ...(units !== undefined && units !== null ? { units } : {}) })
        .eq("id", running.id);
      if (error) return { error: "generic" };
      const { error: startError } = await supabase.from("time_entries").insert({
        source_id: running.source_id,
        kind,
        category_id: categoryId,
        started_at: now.toISOString(),
        origin: "timer",
      });
      if (startError) return { error: "generic" };
    }
  }
  revalidatePath("/app", "layout");
  return null;
}

export async function stopTimer(_prev: TimerState, form: FormData): Promise<TimerState> {
  const { supabase } = await requireUser();
  const id = String(form.get("id") ?? "");
  const units = parseUnits(form.get("units"));
  const { data: running } = await supabase
    .from("time_entries")
    .select("id, started_at")
    .eq("id", id)
    .is("ended_at", null)
    .maybeSingle();
  if (running) {
    const now = new Date();
    const { error } =
      now.getTime() - Date.parse(running.started_at) < MIN_TIMER_MS
        ? await supabase.from("time_entries").delete().eq("id", id)
        : await supabase
            .from("time_entries")
            .update({ ended_at: now.toISOString(), ...(units !== undefined && units !== null ? { units } : {}) })
            .eq("id", id);
    if (error) return { error: "generic" };
  }
  revalidatePath("/app", "layout");
  return null;
}

// --- Time log ------------------------------------------------------------------------

export type EntryFormState = { error?: EntryError | "generic"; ok?: boolean; savedAt?: number } | null;

// Add a missed entry (no id) or edit one (with id).
export async function saveEntry(_prev: EntryFormState, form: FormData): Promise<EntryFormState> {
  const { supabase, profile } = await requireUser();
  const id = String(form.get("id") ?? "");
  let running = false;
  if (id) {
    const { data } = await supabase.from("time_entries").select("ended_at").eq("id", id).maybeSingle();
    if (!data) return { error: "generic" };
    running = data.ended_at === null;
  }
  const parsed = parseEntryForm(form, profile.timezone, new Date(), { running });
  if ("error" in parsed) return { error: parsed.error };
  if (!(await categoryFits(supabase, parsed.data.category_id, parsed.data.kind))) return { error: "category" };

  const { error } = id
    ? await supabase.from("time_entries").update(parsed.data).eq("id", id)
    : await supabase.from("time_entries").insert({ ...parsed.data, origin: "manual" });
  // 23P01: overlaps another entry. 23505: a second running entry. 23503: not one of the user's sources.
  if (error) return { error: error.code === "23P01" || error.code === "23505" ? "overlap" : error.code === "23503" ? "source" : "generic" };
  revalidatePath("/app", "layout");
  if (id) redirect("/app/registro");
  return { ok: true, savedAt: Date.now() };
}

export async function deleteEntry(form: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("time_entries").delete().eq("id", String(form.get("id") ?? ""));
  revalidatePath("/app", "layout");
  redirect("/app/registro");
}

// --- Payments ------------------------------------------------------------------------

export type PaymentFormState = { error?: PaymentError | "generic"; ok?: boolean; savedAt?: number } | null;

// What a default work period needs: where the source's previous payment ended (before a day) and the
// first day it has logged hours.
async function periodContext(supabase: Supabase, sourceId: string, beforeDay: string, timeZone: string, excludeId = "") {
  let previous = supabase
    .from("payments")
    .select("received_on, period_end")
    .eq("source_id", sourceId)
    .lt("received_on", beforeDay)
    .order("received_on", { ascending: false })
    .limit(1);
  if (excludeId) previous = previous.neq("id", excludeId);
  const [{ data: prev }, { data: first }] = await Promise.all([
    previous,
    supabase.from("time_entries").select("started_at").eq("source_id", sourceId).order("started_at").limit(1),
  ]);
  return {
    previousEnd: prev?.[0] ? (prev[0].period_end ?? prev[0].received_on) : null,
    firstWorkDay: first?.[0] ? dayKey(new Date(first[0].started_at), timeZone) : null,
  };
}

export async function savePayment(_prev: PaymentFormState, form: FormData): Promise<PaymentFormState> {
  const { supabase, profile } = await requireUser();
  const id = String(form.get("id") ?? "");
  const parsed = parsePaymentForm(form, dayKey(new Date(), profile.timezone));
  if ("error" in parsed) return { error: parsed.error };
  let row = parsed.data;
  if (!row.period_start) {
    const ctx = await periodContext(supabase, row.source_id, row.received_on, profile.timezone, id);
    const [[start, end]] = defaultPeriods(ctx.previousEnd, ctx.firstWorkDay, [row.received_on]);
    row = { ...row, period_start: start, period_end: end };
  }
  const { error } = id
    ? await supabase.from("payments").update(row).eq("id", id)
    : await supabase.from("payments").insert({ ...row, origin: "manual" });
  // 23503: not one of the user's sources.
  if (error) return { error: error.code === "23503" ? "source" : "generic" };
  revalidatePath("/app", "layout");
  if (id) redirect("/app/pagamentos");
  return { ok: true, savedAt: Date.now() };
}

export async function deletePayment(form: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("payments").delete().eq("id", String(form.get("id") ?? ""));
  revalidatePath("/app", "layout");
  redirect("/app/pagamentos");
}

// Rows picked in the statement preview: [{ day, amount, currency, source_id, ref }]. Rows already imported
// (same import_ref) are skipped by the database.
export async function importPayments(_prev: { error?: "generic" | "source" } | null, form: FormData) {
  const { supabase, profile } = await requireUser();
  let rows: unknown;
  try {
    rows = JSON.parse(String(form.get("rows") ?? "[]"));
  } catch {
    return { error: "generic" as const };
  }
  const latest = addDays(dayKey(new Date(), profile.timezone), 1);
  const valid = (Array.isArray(rows) ? rows : [])
    .slice(0, 500)
    .filter(
      (r): r is { day: string; amount: number; currency: string; source_id: string; ref: string } =>
        r &&
        isDay(r.day) &&
        r.day <= latest &&
        typeof r.amount === "number" &&
        r.amount > 0 &&
        r.amount <= 10_000_000 &&
        (CURRENCIES as readonly string[]).includes(r.currency) &&
        typeof r.source_id === "string" &&
        typeof r.ref === "string" &&
        r.ref.length <= 120,
    );
  if (!valid.length) return { error: "generic" as const };
  const methodText = String(form.get("method") ?? "");
  const method = (METHODS as readonly string[]).includes(methodText) ? (methodText as Method) : null;

  // Default work periods, per source, oldest payment first.
  const inserts: Database["public"]["Tables"]["payments"]["Insert"][] = [];
  for (const sourceId of new Set(valid.map((r) => r.source_id))) {
    const mine = valid.filter((r) => r.source_id === sourceId).sort((a, b) => a.day.localeCompare(b.day));
    const ctx = await periodContext(supabase, sourceId, mine[0].day, profile.timezone);
    const periods = defaultPeriods(ctx.previousEnd, ctx.firstWorkDay, mine.map((r) => r.day));
    mine.forEach((r, i) =>
      inserts.push({
        source_id: sourceId,
        amount: Math.round(r.amount * 100) / 100,
        currency: r.currency,
        received_on: r.day,
        method,
        period_start: periods[i][0],
        period_end: periods[i][1],
        origin: "import",
        import_ref: r.ref,
      }),
    );
  }
  const { data, error } = await supabase
    .from("payments")
    .upsert(inserts, { onConflict: "user_id,import_ref", ignoreDuplicates: true })
    .select("id");
  if (error) return { error: error.code === "23503" ? ("source" as const) : ("generic" as const) };
  revalidatePath("/app", "layout");
  redirect(`/app/pagamentos?importados=${data?.length ?? 0}&existentes=${inserts.length - (data?.length ?? 0)}`);
}

// --- Settings ------------------------------------------------------------------------

export async function saveTaxSettings(_prev: FormState, form: FormData): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const inss = String(form.get("inss_plan") ?? "");
  const dependents = Math.floor(parseNumber(String(form.get("dependents") ?? "0")));
  const accountant = parseNumber(String(form.get("accountant_cost") ?? "250"));
  const { error } = await supabase
    .from("profiles")
    .update({
      tax_mode: form.get("tax_mode") === "cnpj" ? "cnpj" : "pf",
      inss_plan: ["full", "simplified", "none"].includes(inss) ? inss : "full",
      dependents: Math.min(Math.max(dependents, 0), 20),
      accountant_cost: Math.min(Math.max(accountant, 0), 10_000),
    })
    .eq("id", user.id);
  if (error) return { error: "generic" };
  revalidatePath("/app", "layout");
  return { ok: true };
}

export async function saveSettings(_prev: FormState, form: FormData): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const locale = form.get("locale") === "en" ? "en" : "pt-BR";
  const work = form.get("work_type");
  const { error } = await supabase
    .from("profiles")
    .update({
      locale,
      ...(WORK_TYPES.includes(work as (typeof WORK_TYPES)[number]) ? { work_type: work as (typeof WORK_TYPES)[number] } : {}),
    })
    .eq("id", user.id);
  if (error) return { error: "generic" };
  revalidatePath("/app", "layout");
  return { ok: true };
}
