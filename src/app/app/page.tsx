import { Suspense } from "react";
import Link from "next/link";
import { type RunningEntry, Timer, TodayTotals, type TodayRow } from "@/components/app/Timer";
import { TakeHomeCard } from "@/components/app/TakeHomeCard";
import { LateAlerts } from "@/components/app/LateAlerts";
import { TaxReminders } from "@/components/app/TaxReminders";
import { Card, PageSkeleton } from "@/components/app/ui";
import { categoryName, getAppDictionary } from "@/i18n/app";
import { latePayments } from "@/lib/app/alerts";
import { loadInvoices } from "@/lib/app/invoices";
import { monthSummary, taxProfile } from "@/lib/app/money";
import { loadTimerSources } from "@/lib/app/projects";
import { profileLocale, requestNow, requireUser } from "@/lib/app/session";
import { dueReminders, loadTaxYear } from "@/lib/app/taxes";
import { dayKey, startOfDay } from "@/lib/app/time";

async function Today() {
  const { supabase, profile, user } = await requireUser();
  const locale = profileLocale(profile);
  const t = getAppDictionary(locale);
  const tz = profile.timezone;
  const serverNow = requestNow();
  const dayStart = startOfDay(dayKey(new Date(serverNow), tz), tz).getTime();

  const [{ all: sources, projects, active }, { data: categories }, { data: entryRows }] = await Promise.all([
    loadTimerSources(supabase, user.id),
    supabase.from("categories").select("id, kind, name, preset").is("archived_at", null).order("sort"),
    // Everything that touches today: finished today, or still running.
    supabase
      .from("time_entries")
      .select("id, source_id, project_id, kind, category_id, started_at, ended_at")
      .or(`ended_at.gte.${new Date(dayStart).toISOString()},ended_at.is.null`)
      .order("started_at"),
  ]);
  const entries = entryRows ?? [];
  const byId = new Map(sources.map((s) => [s.id, s]));
  const nameOf = (id: string | null) => (id ? (byId.get(id)?.name ?? "") : t.timer.noClient);

  const runningRow = entries.find((e) => !e.ended_at);
  const running: RunningEntry | null = runningRow
    ? {
        id: runningRow.id,
        sourceId: runningRow.source_id,
        sourceName: nameOf(runningRow.source_id),
        projectName: projects.find((p) => p.id === runningRow.project_id)?.name ?? null,
        kind: runningRow.kind,
        categoryId: runningRow.category_id,
        startedAt: Date.parse(runningRow.started_at),
        perTask: runningRow.source_id ? byId.get(runningRow.source_id)?.pay_model === "per_task" : false,
      }
    : null;

  // Finished time today per platform (from midnight), time without a client last. The running entry is
  // added live on the client.
  const totals = new Map<string | null, TodayRow>();
  const row = (id: string | null) => {
    if (!totals.has(id)) totals.set(id, { sourceId: id, name: nameOf(id), paidMs: 0, unpaidMs: 0 });
    return totals.get(id)!;
  };
  for (const e of entries) {
    if (!e.ended_at) {
      row(e.source_id);
      continue;
    }
    const ms = Math.max(0, Date.parse(e.ended_at) - Math.max(Date.parse(e.started_at), dayStart));
    if (e.kind === "paid") row(e.source_id).paidMs += ms;
    else row(e.source_id).unpaidMs += ms;
  }

  // Start with the platform used last today, else the first one.
  const last = entries.at(-1);
  const defaultSourceId = last?.source_id && active.some((s) => s.id === last.source_id) ? last.source_id : (active[0]?.id ?? null);
  const date = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: tz }).format(serverNow);

  // This month's take-home: first for freelancers (what's left matters most to them), after the timer for others.
  const today = dayKey(new Date(serverNow), tz);
  const [month, taxYear, late, invoices] = await Promise.all([
    monthSummary(supabase, profile, user.id, Number(today.slice(0, 4)), Number(today.slice(5, 7))),
    loadTaxYear(supabase, profile, user.id, Number(today.slice(0, 4)), today),
    latePayments(supabase, user.id, tz, today),
    loadInvoices(supabase, user.id, today),
  ]);
  const takeHome = (
    <TakeHomeCard
      t={t}
      locale={locale}
      month={new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(new Date(`${today.slice(0, 7)}-15T12:00:00Z`))}
      takeHome={month.takeHome}
      count={month.count}
      mode={taxProfile(profile).tax_mode}
      compact
    />
  );
  const freelancer = profile.work_type === "freelancer";

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em]">{t.today.title}</h1>
        <p className="m-0 text-[15px] text-ink-soft first-letter:uppercase">{date}</p>
      </div>

      <TaxReminders t={t} locale={locale} mode={taxYear.mode} reminders={dueReminders(taxYear, today)} current={taxYear.months.at(-1)} />
      <LateAlerts t={t} locale={locale} alerts={late} invoices={invoices} />

      {freelancer && takeHome}

      <div className="grid items-start gap-5 md:grid-cols-[1.25fr_1fr]">
        <Card>
          <Timer
            t={t}
            sources={active}
            categories={(categories ?? []).map((c) => ({ ...c, name: categoryName(c, locale) }))}
            running={running}
            defaultSourceId={defaultSourceId}
            serverNow={serverNow}
          />
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 text-[17px] font-bold">{t.today.byPlatform}</h2>
            <Link href="/app/registro" className="text-[14px] font-semibold">
              {t.today.seeLog}
            </Link>
          </div>
          <TodayTotals
            t={t}
            locale={locale}
            rows={[...totals.values()].sort((a, b) => Number(a.sourceId === null) - Number(b.sourceId === null))}
            running={running}
            dayStart={dayStart}
            serverNow={serverNow}
          />
        </Card>
      </div>

      {!freelancer && takeHome}
    </>
  );
}

export default function TodayPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Today />
    </Suspense>
  );
}
