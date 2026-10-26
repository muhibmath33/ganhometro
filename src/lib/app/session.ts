// Data access layer for the app: one place that reads the session and profile.
// Pages and actions call these and never trust the client for authorization.
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import type { Locale } from "@/i18n/config";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type Profile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  | "locale"
  | "timezone"
  | "work_type"
  | "plan"
  | "pro_until"
  | "onboarded_at"
  | "tax_mode"
  | "inss_plan"
  | "dependents"
  | "accountant_cost"
  | "salary_target"
  | "reserve_13th"
  | "reserve_vacation"
  | "emergency_pct"
  | "emergency_months"
  | "email_reminders"
  | "email_weekly"
  | "doc_name"
  | "doc_details"
  | "payment_instructions"
>;

export const PROFILE_FIELDS =
  "locale, timezone, work_type, plan, pro_until, onboarded_at, tax_mode, inss_plan, dependents, accountant_cost, salary_target, reserve_13th, reserve_vacation, emergency_pct, emergency_months, email_reminders, email_weekly, doc_name, doc_details, payment_instructions";

// Memoized per request, so the layout and the page share one lookup.
export const getSession = cache(async () => {
  // Request time only: Supabase checks token expiry against the clock, which can't run in a prerender
  // (including the per-session runtime prefetch, where cookies are available).
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase
    .from("profiles")
    .select(PROFILE_FIELDS)
    .eq("id", data.user.id)
    .single();
  return { supabase, user: { id: data.user.id, email: data.user.email ?? "" }, profile: profile as Profile | null };
});

export async function requireUser({ onboarded = true } = {}) {
  const session = await getSession();
  if (!session.user || !session.profile) redirect("/app/entrar");
  if (onboarded && !session.profile.onboarded_at) redirect("/app/boas-vindas");
  return { supabase: session.supabase, user: session.user, profile: session.profile };
}

// The time of this request, the same everywhere in one render (layout, page, helpers).
// Call it after requireUser(), which has already deferred rendering to request time.
export const requestNow = cache(() => Date.now());

export const profileLocale =(profile: Profile | null): Locale => (profile?.locale === "en" ? "en" : "pt-BR");

export function isPro(profile: Profile): boolean {
  return profile.plan === "pro" || (profile.pro_until !== null && new Date(profile.pro_until) > new Date());
}
