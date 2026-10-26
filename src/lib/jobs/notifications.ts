// Background jobs that email people: DARF/DAS reminders and late payments (daily) and the Monday summary.
// They use the secret key (there's no session), so every loader filters by user id. Each email is logged in
// email_log first, so it goes out once even if a job runs twice.
import "server-only";
import { brl, formatDay } from "@/components/calculators/shared";
import { getAppDictionary } from "@/i18n/app";
import { fill, type Locale } from "@/i18n/config";
import { getEmailDictionary } from "@/i18n/emails";
import { latePayments } from "@/lib/app/alerts";
import { monthSummary } from "@/lib/app/money";
import { PROFILE_FIELDS, type Profile, profileLocale } from "@/lib/app/session";
import { dueReminders, loadTaxYear } from "@/lib/app/taxes";
import { addDays, dayKey, formatDuration, startOfDay } from "@/lib/app/time";
import { type Email, sendEmail } from "@/lib/email/send";
import { darfReminderEmail, latePaymentEmail, weeklySummaryEmail } from "@/lib/email/templates";
import { entryHours } from "@/lib/money/realRate";
import { adminClient } from "@/lib/supabase/admin";

type Admin = NonNullable<ReturnType<typeof adminClient>>;
type Person = { id: string; email: string; profile: Profile };
type Result = "sent" | "skipped" | "failed";

// Everyone who finished onboarding, with their email address.
async function people(admin: Admin): Promise<Person[]> {
  const { data: profiles } = await admin.from("profiles").select(`id, ${PROFILE_FIELDS}`).not("onboarded_at", "is", null);
  const emails = new Map<string, string>();
  for (let page = 1; ; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    for (const u of data?.users ?? []) if (u.email) emails.set(u.id, u.email);
    if (!data || data.users.length < 1000) break;
  }
  return (profiles ?? []).filter((p) => emails.has(p.id)).map((p) => ({ id: p.id, email: emails.get(p.id)!, profile: p }));
}

async function sendOnce(admin: Admin, userId: string, type: "darf_reminder" | "late_payment" | "weekly_summary", ref: string, email: () => Email): Promise<Result> {
  const { error } = await admin.from("email_log").insert({ user_id: userId, type, ref });
  if (error) return error.code === "23505" ? "skipped" : "failed";
  const result = await sendEmail(email());
  if (!result.ok) {
    // Not sent: forget it, so the next run tries again.
    await admin.from("email_log").delete().match({ user_id: userId, type, ref });
    console.error("[jobs] email failed:", type, ref, result.error);
    return "failed";
  }
  return "sent";
}

const monthName = (key: string, locale: Locale) => new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(new Date(`${key}-15T12:00:00Z`));
const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);

// Daily: a DARF (or DAS) reminder 5 days and 1 day before it's due, and an alert when a payment looks late.
export async function runDailyNotifications(now = new Date()) {
  const admin = adminClient();
  if (!admin) throw new Error("Supabase is not configured");
  const counts = { darf: 0, late: 0, skipped: 0, failed: 0 };
  const tally = (result: Result, kind: "darf" | "late") => {
    if (result === "sent") counts[kind]++;
    else counts[result]++;
  };
  for (const person of await people(admin)) {
    if (!person.profile.email_reminders) continue;
    const locale = profileLocale(person.profile);
    const tz = person.profile.timezone;
    const today = dayKey(now, tz);
    const taxYear = await loadTaxYear(admin, person.profile, person.id, Number(today.slice(0, 4)), today);
    for (const m of taxYear.months) {
      if (m.amountDue <= 0 || m.paidOn || today > m.due) continue;
      const days = daysBetween(today, m.due);
      const threshold = days <= 1 ? 1 : days <= 5 ? 5 : null;
      if (!threshold) continue;
      tally(
        await sendOnce(admin, person.id, "darf_reminder", `darf:${m.key}:d${threshold}`, () =>
          darfReminderEmail(locale, person.email, {
            mode: taxYear.mode,
            month: monthName(m.key, locale),
            monthKey: m.key,
            amount: brl(m.amountDue, locale),
            due: formatDay(m.due, locale),
            days: threshold,
          }),
        ),
        "darf",
      );
    }
    for (const alert of await latePayments(admin, person.id, tz, today)) {
      tally(
        await sendOnce(admin, person.id, "late_payment", `late:${alert.sourceId}:${alert.payday}`, () =>
          latePaymentEmail(locale, person.email, alert, (day) => formatDay(day, locale)),
        ),
        "late",
      );
    }
  }
  return counts;
}

// Mondays: last week's hours, this month's take-home so far, and anything that needs attention.
export async function runWeeklySummary(now = new Date()) {
  const admin = adminClient();
  if (!admin) throw new Error("Supabase is not configured");
  const counts = { sent: 0, quiet: 0, skipped: 0, failed: 0 };
  for (const person of await people(admin)) {
    if (!person.profile.email_weekly) continue;
    const locale = profileLocale(person.profile);
    const t = getAppDictionary(locale);
    const e = getEmailDictionary(locale);
    const tz = person.profile.timezone;
    const today = dayKey(now, tz);
    const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
    const thisMonday = addDays(today, -((weekday + 6) % 7));
    const lastMonday = addDays(thisMonday, -7);

    const [{ data: entries }, { data: sources }, month, taxYear, late] = await Promise.all([
      admin
        .from("time_entries")
        .select("source_id, kind, started_at, ended_at, units")
        .eq("user_id", person.id)
        .gte("started_at", startOfDay(lastMonday, tz).toISOString())
        .lt("started_at", startOfDay(thisMonday, tz).toISOString()),
      admin.from("income_sources").select("id, name").eq("user_id", person.id),
      monthSummary(admin, person.profile, person.id, Number(today.slice(0, 4)), Number(today.slice(5, 7))),
      loadTaxYear(admin, person.profile, person.id, Number(today.slice(0, 4)), today),
      latePayments(admin, person.id, tz, today),
    ]);
    const nowMs = now.getTime();
    const hoursOf = (list: NonNullable<typeof entries>) => list.reduce((sum, x) => sum + entryHours(x, nowMs), 0);
    const paid = hoursOf((entries ?? []).filter((x) => x.kind === "paid"));
    const unpaid = hoursOf((entries ?? []).filter((x) => x.kind === "unpaid"));
    const dur = (h: number) => formatDuration(h * 3_600_000, locale);
    const names = new Map((sources ?? []).map((s) => [s.id, s.name]));
    const perSource = new Map<string, number>();
    for (const x of entries ?? []) perSource.set(x.source_id, (perSource.get(x.source_id) ?? 0) + entryHours(x, nowMs));

    const attention = [
      ...dueReminders(taxYear, today).map((m) =>
        fill(t.taxes.reminders[m.status === "overdue" ? "overdue" : "soon"][taxYear.mode], {
          month: monthName(m.key, locale),
          amount: brl(m.amountDue, locale),
          date: formatDay(m.due, locale),
        }),
      ),
      ...late.map((a) => fill(e.weekly.late, { source: a.name, payday: formatDay(a.payday, locale) })),
    ];
    if (paid + unpaid === 0 && month.count === 0 && !attention.length) {
      counts.quiet++;
      continue;
    }
    const result = await sendOnce(admin, person.id, "weekly_summary", `week:${lastMonday}`, () =>
      weeklySummaryEmail(locale, person.email, {
        from: formatDay(lastMonday, locale),
        to: formatDay(addDays(thisMonday, -1), locale),
        hours:
          paid + unpaid > 0
            ? { total: dur(paid + unpaid), paid: dur(paid), unpaid: dur(unpaid), share: `${Math.round((unpaid / (paid + unpaid)) * 100)}%` }
            : null,
        platforms: [...perSource].map(([id, h]) => `${names.get(id) ?? "?"} ${dur(h)}`),
        month: monthName(today.slice(0, 7), locale),
        received: month.count ? brl(month.takeHome.received, locale) : null,
        kept: month.count ? brl(month.takeHome.kept, locale) : null,
        attention,
      }),
    );
    counts[result === "sent" ? "sent" : result]++;
  }
  return counts;
}
