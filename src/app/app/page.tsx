import { Suspense } from "react";
import Link from "next/link";
import { type RunningEntry, Timer, TodayTotals, type TodayRow } from "@/components/app/Timer";
import { Card, PageSkeleton } from "@/components/app/ui";
import { categoryName, getAppDictionary } from "@/i18n/app";
import { profileLocale, requestNow, requireUser } from "@/lib/app/session";
import { dayKey, startOfDay } from "@/lib/app/time";

async function Today() {
  const { supabase, profile } = await requireUser();
  const locale = profileLocale(profile);
  const t = getAppDictionary(locale);
  const tz = profile.timezone;
  const serverNow = requestNow();
  const dayStart = startOfDay(dayKey(new Date(serverNow), tz), tz).getTime();

  const [{ data: sourceRows }, { data: categories }, { data: entryRows }] = await Promise.all([
    supabase.from("income_sources").select("id, name, pay_model, archived_at").order("created_at"),
    supabase.from("categories").select("id, kind, name, preset").is("archived_at", null).order("sort"),
    // Everything that touches today: finished today, or still running.
    supabase
      .from("time_entries")
      .select("id, source_id, kind, category_id, started_at, ended_at")
      .or(`ended_at.gte.${new Date(dayStart).toISOString()},ended_at.is.null`)
      .order("started_at"),
  ]);
  const sources = sourceRows ?? [];
  const entries = entryRows ?? [];
  const byId = new Map(sources.map((s) => [s.id, s]));
  const active = sources.filter((s) => !s.archived_at).map((s) => ({ id: s.id, name: s.name, perTask: s.pay_model === "per_task" }));

  const runningRow = entries.find((e) => !e.ended_at);
  const running: RunningEntry | null = runningRow
    ? {
        id: runningRow.id,
        sourceId: runningRow.source_id,
        sourceName: byId.get(runningRow.source_id)?.name ?? "",
        kind: runningRow.kind,
        categoryId: runningRow.category_id,
        startedAt: Date.parse(runningRow.started_at),
        perTask: byId.get(runningRow.source_id)?.pay_model === "per_task",
      }
    : null;

  // Finished time today per platform (from midnight). The running entry is added live on the client.
  const totals = new Map<string, TodayRow>();
  const row = (id: string) => {
    if (!totals.has(id)) totals.set(id, { sourceId: id, name: byId.get(id)?.name ?? "", paidMs: 0, unpaidMs: 0 });
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
  const defaultSourceId = last && active.some((s) => s.id === last.source_id) ? last.source_id : (active[0]?.id ?? null);
  const date = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: tz }).format(serverNow);

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em]">{t.today.title}</h1>
        <p className="m-0 text-[15px] text-ink-soft first-letter:uppercase">{date}</p>
      </div>

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
          <TodayTotals t={t} locale={locale} rows={[...totals.values()]} running={running} dayStart={dayStart} serverNow={serverNow} />
        </Card>
      </div>
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
