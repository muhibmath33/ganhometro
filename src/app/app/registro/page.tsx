import Link from "next/link";
import { Suspense } from "react";
import { EntryForm } from "@/components/app/EntryForm";
import { Card, KindBadge, PageSkeleton } from "@/components/app/ui";
import { categoryName, getAppDictionary } from "@/i18n/app";
import { fill } from "@/i18n/config";
import { type Entry, entryTimes } from "@/lib/app/entries";
import { loadTimerSources } from "@/lib/app/projects";
import { profileLocale, requestNow, requireUser } from "@/lib/app/session";
import { dayKey, formatDuration } from "@/lib/app/time";

const PAGE = 60;

async function TimeLog({ searchParams }: { searchParams: PageProps<"/app/registro">["searchParams"] }) {
  const { supabase, profile, user } = await requireUser();
  const locale = profileLocale(profile);
  const t = getAppDictionary(locale);
  const tz = profile.timezone;
  const params = await searchParams;
  // Older pages: entries that started before this instant.
  const before = typeof params.antes === "string" && !Number.isNaN(Date.parse(params.antes)) ? new Date(params.antes).toISOString() : null;

  let query = supabase
    .from("time_entries")
    .select("id, source_id, project_id, kind, category_id, units, started_at, ended_at, origin")
    .order("started_at", { ascending: false })
    .limit(PAGE + 1);
  if (before) query = query.lt("started_at", before);
  const [{ data: rows }, { all: sources, projects, active }, { data: categoryRows }] = await Promise.all([
    query,
    loadTimerSources(supabase, user.id),
    supabase.from("categories").select("id, kind, name, preset, archived_at").order("sort"),
  ]);
  const entries = (rows ?? []).slice(0, PAGE);
  const nextCursor = (rows?.length ?? 0) > PAGE ? entries[entries.length - 1].started_at : null;
  const categories = (categoryRows ?? []).map((c) => ({ ...c, name: categoryName(c, locale) }));
  const sourceName = new Map(sources.map((s) => [s.id, s.name]));
  const projectName = new Map(projects.map((p) => [p.id, p.name]));
  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));

  const serverNow = requestNow();
  const today = dayKey(new Date(serverNow), tz);
  const duration = (e: Pick<Entry, "started_at" | "ended_at">) =>
    (e.ended_at ? Date.parse(e.ended_at) : serverNow) - Date.parse(e.started_at);

  // Group by the day each entry started, on the user's clock.
  const days: { day: string; entries: typeof entries }[] = [];
  for (const e of entries) {
    const day = dayKey(new Date(e.started_at), tz);
    if (days.at(-1)?.day !== day) days.push({ day, entries: [] });
    days[days.length - 1].entries.push(e);
  }
  const dayLabel = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: tz });

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em]">{t.log.title}</h1>
        <p className="m-0 max-w-[640px] text-[15px] text-ink-soft">{t.log.lead}</p>
        <Link href="/app/registro/importar" className="mt-1 self-start rounded-[9px] border border-line bg-white px-3 py-2 text-[14px] font-semibold no-underline">
          {t.timeImport.link}
        </Link>
      </div>

      {typeof params.importadas === "string" && (
        <p role="status" className="m-0 rounded-[12px] bg-brand-tint px-4 py-3 text-[14px] font-semibold text-brand">
          {fill(t.timeImport.result, { added: params.importadas, existing: String(params.existentes ?? 0), overlap: String(params.sobrepostas ?? 0) })}
        </p>
      )}

      {!before && (
        <Card>
          <details open={entries.length === 0} className="group">
            <summary className="cursor-pointer text-[17px] font-bold marker:text-brand">{t.log.add}</summary>
            <div className="pt-4">
              {active.length ? (
                <EntryForm
                  t={t}
                  sources={active}
                  categories={categories.filter((c) => !c.archived_at)}
                  maxDate={today}
                  values={{
                    sourceId: active[0].id,
                    projectId: null,
                    kind: "paid",
                    categoryId: categories.find((c) => c.kind === "paid" && !c.archived_at)?.id ?? null,
                    date: today,
                    start: "",
                    end: "",
                    units: null,
                    running: false,
                  }}
                />
              ) : (
                <Link href="/app/fontes" className="text-[15px] font-semibold">
                  {t.timer.addSource}
                </Link>
              )}
            </div>
          </details>
        </Card>
      )}

      {days.length === 0 && <p className="m-0 text-[15px] text-muted">{t.log.empty}</p>}

      {days.map(({ day, entries: dayEntries }) => {
        const total = dayEntries.reduce((sum, e) => sum + duration(e), 0);
        const unpaid = dayEntries.filter((e) => e.kind === "unpaid").reduce((sum, e) => sum + duration(e), 0);
        return (
          <Card key={day}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="m-0 text-[17px] font-bold first-letter:uppercase">{dayLabel.format(new Date(dayEntries[0].started_at))}</h2>
              <span className="text-[14px] text-ink-soft">
                {unpaid > 0
                  ? t.log.dayTotal.replace("{total}", formatDuration(total, locale)).replace("{unpaid}", formatDuration(unpaid, locale))
                  : formatDuration(total, locale)}
              </span>
            </div>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {dayEntries.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 rounded-[12px] bg-paper px-4 py-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-[15px] font-bold">
                      <span className="font-mono">{entryTimes(e, tz, t)}</span> · {formatDuration(duration(e), locale)}
                    </span>
                    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-ink-soft">
                      <KindBadge t={t} kind={e.kind} />
                      {!e.ended_at && (
                        <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold tracking-[0.04em] text-white uppercase">
                          {t.log.running}
                        </span>
                      )}
                      <span>
                        {[
                          e.source_id ? sourceName.get(e.source_id) : t.timer.noClient,
                          e.project_id ? projectName.get(e.project_id) : null,
                          e.category_id ? categoryNames.get(e.category_id) : null,
                          e.units !== null ? t.log.units.replace("{n}", String(e.units)) : null,
                          e.origin === "manual" ? t.log.manual : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                  </div>
                  <Link
                    href={`/app/registro/${e.id}`}
                    className="shrink-0 rounded-[9px] border border-line bg-white px-3 py-2 text-[13px] font-semibold no-underline"
                  >
                    {t.common.edit}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}

      {nextCursor && (
        <Link href={`/app/registro?antes=${encodeURIComponent(nextCursor)}`} className="self-start text-[15px] font-semibold">
          {t.log.more}
        </Link>
      )}
    </>
  );
}

export default function TimeLogPage({ searchParams }: PageProps<"/app/registro">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TimeLog searchParams={searchParams} />
    </Suspense>
  );
}
