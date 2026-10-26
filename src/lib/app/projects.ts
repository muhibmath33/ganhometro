// Projects inside a client or platform: same pay as the client, their own hourly rate, or a fixed price.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppDictionary } from "@/i18n/app";
import type { Locale } from "@/i18n/config";
import { formatMoney, parseNumber } from "@/lib/calc";
import type { Database } from "@/lib/supabase/database.types";
import { currencySymbol } from "./sources";

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectError = keyof AppDictionary["project"]["errors"];
export const PROJECT_PAYS = ["same", "hourly", "fixed"] as const;

export function parseProjectForm(
  form: FormData,
): { data: Pick<Project, "name" | "pay_model" | "rate" | "fixed_price"> } | { error: ProjectError } {
  const name = String(form.get("name") ?? "").trim();
  if (name.length < 1 || name.length > 60) return { error: "name" };
  const pay = String(form.get("pay") ?? "same");
  const amount = (field: string) => {
    const text = String(form.get(field) ?? "").trim();
    const n = text ? parseNumber(text) : NaN;
    return Number.isFinite(n) && n >= 0 && n <= 9_999_999 ? n : null;
  };
  if (pay === "hourly") {
    const rate = amount("rate");
    if (rate === null || rate > 99_999) return { error: "rate" };
    return { data: { name, pay_model: "hourly", rate, fixed_price: null } };
  }
  if (pay === "fixed") {
    const price = amount("fixed_price");
    if (price === null) return { error: "price" };
    return { data: { name, pay_model: "fixed", rate: null, fixed_price: price } };
  }
  return { data: { name, pay_model: null, rate: null, fixed_price: null } };
}

// "US$ 40,00/h", "preço fechado US$ 1.500,00" or "mesmo valor do cliente".
export function describeProject(project: Pick<Project, "pay_model" | "rate" | "fixed_price">, currency: string, t: AppDictionary, locale: Locale) {
  const symbol = currencySymbol(currency);
  if (project.pay_model === "hourly" && project.rate !== null) return formatMoney(symbol, Number(project.rate), locale) + t.sources.perHour;
  if (project.pay_model === "fixed" && project.fixed_price !== null)
    return t.project.fixed.replace("{price}", formatMoney(symbol, Number(project.fixed_price), locale));
  return t.project.same;
}

// Sources for the timer and the entry form, each with its active projects. `keep` adds archived ones back
// (an entry being edited keeps its own source and project).
export async function loadTimerSources(
  supabase: SupabaseClient<Database>,
  userId: string,
  keep: { sourceId?: string | null; projectId?: string | null } = {},
) {
  const [{ data: sourceRows }, { data: projectRows }] = await Promise.all([
    supabase.from("income_sources").select("id, name, pay_model, archived_at").eq("user_id", userId).order("created_at"),
    supabase.from("projects").select("id, source_id, name, archived_at").eq("user_id", userId).order("created_at"),
  ]);
  const all = sourceRows ?? [];
  const projects = projectRows ?? [];
  const active = all
    .filter((s) => !s.archived_at || s.id === keep.sourceId)
    .map((s) => ({
      id: s.id,
      name: s.name,
      perTask: s.pay_model === "per_task",
      projects: projects.filter((p) => p.source_id === s.id && (!p.archived_at || p.id === keep.projectId)).map((p) => ({ id: p.id, name: p.name })),
    }));
  return { all, projects, active };
}
