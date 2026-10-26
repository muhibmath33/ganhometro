"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CATEGORY_PRESETS } from "@/i18n/app";
import { parseSourceForm, type SourceError, WORK_TYPES } from "@/lib/app/sources";
import { getSession, requireUser } from "@/lib/app/session";
import { site } from "@/lib/site";
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

// --- Settings ------------------------------------------------------------------------

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
