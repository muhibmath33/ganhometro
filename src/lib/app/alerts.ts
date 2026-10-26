// Late payments (feature 4), for the pages and the daily job. userId is filtered explicitly: the job uses
// the secret key, which bypasses Row Level Security.
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { latePayday, type Schedule } from "@/lib/money/paydays";
import type { Database } from "@/lib/supabase/database.types";
import { addDays, dayKey, startOfDay } from "./time";

export type LateAlert = { sourceId: string; name: string; schedule: Schedule; payday: string; workSince: string };

export async function latePayments(supabase: SupabaseClient<Database>, userId: string, timeZone: string, today: string): Promise<LateAlert[]> {
  const since = startOfDay(addDays(today, -90), timeZone).toISOString();
  const [{ data: sources }, { data: payments }, { data: entries }] = await Promise.all([
    supabase
      .from("income_sources")
      .select("id, name, pay_schedule, pay_weekday, pay_day, grace_days, created_at")
      .eq("user_id", userId)
      .is("archived_at", null)
      .in("pay_schedule", ["weekly", "biweekly", "monthly"]),
    supabase.from("payments").select("source_id, received_on").eq("user_id", userId).order("received_on"),
    supabase.from("time_entries").select("source_id, started_at").eq("user_id", userId).eq("kind", "paid").gte("started_at", since),
  ]);
  const alerts: LateAlert[] = [];
  for (const s of sources ?? []) {
    const mine = (payments ?? []).filter((p) => p.source_id === s.id);
    const workDays = [...new Set((entries ?? []).filter((e) => e.source_id === s.id).map((e) => dayKey(new Date(e.started_at), timeZone)))].sort();
    const schedule = { pay_schedule: s.pay_schedule, pay_weekday: s.pay_weekday, pay_day: s.pay_day, grace_days: s.grace_days };
    const late = latePayday(schedule, {
      today,
      lastPayment: mine.at(-1)?.received_on ?? null,
      paidWorkDays: workDays,
      // Every two weeks counts from the first payment, or the day the source was added.
      anchor: mine[0]?.received_on ?? dayKey(new Date(s.created_at), timeZone),
    });
    if (late) alerts.push({ sourceId: s.id, name: s.name, schedule, ...late });
  }
  return alerts;
}
