"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { startTimer, stopTimer, switchTimer, type TimerState } from "@/app/app/actions";
import type { AppDictionary } from "@/i18n/app";
import { type Category, type EntryKind, NO_CLIENT } from "@/lib/app/entries";
import { formatClock, formatDuration } from "@/lib/app/time";
import { fieldInput, fieldLabel } from "./SourceFields";
import { Chip, KindBadge, legendClass, SplitBar, SplitLegend } from "./ui";

export type TimerSource = { id: string; name: string; perTask: boolean; projects: { id: string; name: string }[] };
export type RunningEntry = {
  id: string;
  sourceId: string | null; // null: time without a client
  sourceName: string;
  projectName: string | null;
  kind: EntryKind;
  categoryId: string | null;
  startedAt: number;
  perTask: boolean;
};

const LONG_MS = 12 * 3_600_000;

// The current time, ticking. It starts from the server's clock, so the first render matches the
// HTML, and keeps the server's offset, so a phone with a wrong clock still shows the right time.
function useNow(serverNow: number, intervalMs: number) {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const offset = serverNow - Date.now();
    const id = setInterval(() => setNow(Date.now() + offset), intervalMs);
    return () => clearInterval(id);
  }, [serverNow, intervalMs]);
  // After a server action re-renders the page, serverNow is newer than the last tick.
  return Math.max(now, serverNow);
}

const bigButton =
  "flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-[12px] border-0 px-6 font-sans text-[17px] font-bold disabled:cursor-wait disabled:opacity-70";
const secondaryButton =
  "min-h-14 cursor-pointer rounded-[12px] border border-line bg-white px-5 font-sans text-[15px] font-semibold text-ink disabled:cursor-wait disabled:opacity-70";

export function Timer(props: {
  t: AppDictionary;
  sources: TimerSource[];
  categories: Category[];
  running: RunningEntry | null;
  defaultSourceId: string | null;
  serverNow: number;
}) {
  if (props.running) return <RunningTimer {...props} running={props.running} />;
  if (!props.sources.length) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="m-0 text-[15px] text-ink-soft">{props.t.timer.noSources}</p>
        <Link href="/app/fontes" className="text-[15px] font-semibold">
          {props.t.timer.addSource}
        </Link>
      </div>
    );
  }
  return <StartTimer {...props} />;
}

function StartTimer({ t, sources, categories, defaultSourceId }: Parameters<typeof Timer>[0]) {
  const [state, action, pending] = useActionState<TimerState, FormData>(startTimer, null);
  const [sourceId, setSourceId] = useState(defaultSourceId ?? sources[0].id);
  const [projectId, setProjectId] = useState("");
  const [chosenKind, setKind] = useState<EntryKind>("paid");
  const noClient = sourceId === NO_CLIENT;
  // Time without a client is always unpaid.
  const kind = noClient ? "unpaid" : chosenKind;
  const ofKind = categories.filter((c) => c.kind === kind);
  const [categoryId, setCategoryId] = useState(ofKind[0]?.id ?? "");
  const projects = sources.find((s) => s.id === sourceId)?.projects ?? [];

  const chooseKind = (k: EntryKind) => {
    setKind(k);
    setCategoryId(categories.find((c) => c.kind === k)?.id ?? "");
  };
  const chooseSource = (id: string) => {
    const nextKind = id === NO_CLIENT ? "unpaid" : chosenKind;
    if (nextKind !== kind) setCategoryId(categories.find((c) => c.kind === nextKind)?.id ?? "");
    setSourceId(id);
    setProjectId("");
  };

  return (
    <form action={action} className="flex flex-col gap-4">
      <fieldset className="m-0 border-0 p-0">
        <legend className={legendClass}>{t.timer.source}</legend>
        <div className="flex flex-wrap gap-2">
          {sources.map((s) => (
            <Chip key={s.id} name="source_id" value={s.id} checked={sourceId === s.id} onChange={() => chooseSource(s.id)}>
              {s.name}
            </Chip>
          ))}
          <Chip name="source_id" value={NO_CLIENT} tone="unpaid" checked={noClient} onChange={() => chooseSource(NO_CLIENT)}>
            {t.timer.noClient}
          </Chip>
        </div>
      </fieldset>

      {projects.length > 0 && (
        <fieldset className="m-0 border-0 p-0">
          <legend className={legendClass}>{t.timer.project}</legend>
          <div className="flex flex-wrap gap-2">
            <Chip name="project_id" value="" checked={projectId === ""} onChange={() => setProjectId("")}>
              {t.timer.noProject}
            </Chip>
            {projects.map((p) => (
              <Chip key={p.id} name="project_id" value={p.id} checked={projectId === p.id} onChange={() => setProjectId(p.id)}>
                {p.name}
              </Chip>
            ))}
          </div>
        </fieldset>
      )}

      {noClient ? (
        <>
          <input type="hidden" name="kind" value="unpaid" />
          <p className="m-0 rounded-[12px] bg-amber-tint px-4 py-3 text-[14px] text-amber-ink">{t.timer.noClientNote}</p>
        </>
      ) : (
        <fieldset className="m-0 border-0 p-0">
          <legend className={legendClass}>{t.timer.kind}</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["paid", "unpaid"] as const).map((k) => (
              <Chip key={k} name="kind" value={k} tone={k} checked={kind === k} onChange={() => chooseKind(k)}>
                {t.kinds[k]}
              </Chip>
            ))}
          </div>
        </fieldset>
      )}

      {/* One category of a kind (usually "paid task") needs no choice. */}
      {ofKind.length > 1 ? (
        <fieldset className="m-0 border-0 p-0">
          <legend className={legendClass}>{t.timer.category}</legend>
          <div className="flex flex-wrap gap-2">
            {ofKind.map((c) => (
              <Chip key={c.id} name="category_id" value={c.id} tone={kind} checked={categoryId === c.id} onChange={() => setCategoryId(c.id)}>
                {c.name}
              </Chip>
            ))}
          </div>
        </fieldset>
      ) : (
        <input type="hidden" name="category_id" value={ofKind[0]?.id ?? ""} />
      )}

      {state?.error && (
        <p role="alert" className="m-0 text-[14px] font-semibold text-amber-ink">
          {t.common.genericError}
        </p>
      )}
      <button type="submit" disabled={pending} className={`${bigButton} bg-brand text-white`}>
        <span aria-hidden="true">▶</span> {t.timer.start}
      </button>
    </form>
  );
}

function RunningTimer({ t, categories, running, serverNow }: Parameters<typeof Timer>[0] & { running: RunningEntry }) {
  const now = useNow(serverNow, 1000);
  const [switchState, switchAction, switching] = useActionState<TimerState, FormData>(switchTimer, null);
  const [stopState, stopAction, stopping] = useActionState<TimerState, FormData>(stopTimer, null);
  const [confirming, setConfirming] = useState(false);
  const pending = switching || stopping;

  const elapsed = now - running.startedAt;
  const long = elapsed > LONG_MS;
  const other: EntryKind = running.kind === "paid" ? "unpaid" : "paid";
  const ofKind = categories.filter((c) => c.kind === running.kind);
  const category = categories.find((c) => c.id === running.categoryId);
  const firstOther = categories.find((c) => c.kind === other);

  return (
    // A new entry (after a switch) remounts the form, which clears the task count.
    <form key={running.id} action={switchAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={running.id} />

      <div className="flex flex-col items-center gap-1.5 py-1 text-center">
        <span className="flex items-center gap-2 text-[14px] font-semibold text-ink-soft">
          <span className="size-2 animate-pulse rounded-full bg-brand" aria-hidden="true" />
          {t.timer.running} · {running.sourceName}
          {running.projectName && ` · ${running.projectName}`}
        </span>
        <span role="timer" className="font-mono text-[52px] leading-none font-semibold tracking-[-0.02em] tabular-nums">
          {formatClock(elapsed)}
        </span>
        <span className="flex flex-wrap items-center justify-center gap-1.5 text-[14px] text-ink-soft">
          <KindBadge t={t} kind={running.kind} />
          {category?.name}
        </span>
      </div>

      {ofKind.length > 1 && (
        <fieldset className="m-0 border-0 p-0">
          <legend className={legendClass}>{t.timer.category}</legend>
          <div className="flex flex-wrap gap-2">
            {ofKind.map((c) => {
              const current = c.id === running.categoryId;
              return (
                <button
                  key={c.id}
                  type="submit"
                  name="target"
                  value={`${running.kind}:${c.id}`}
                  aria-pressed={current}
                  disabled={pending || current}
                  className={`min-h-11 cursor-pointer rounded-[10px] border px-3.5 font-sans text-[15px] font-semibold disabled:cursor-default ${
                    current
                      ? running.kind === "paid"
                        ? "border-brand bg-brand-tint text-brand"
                        : "border-amber bg-amber-tint text-amber-ink"
                      : "border-field bg-white text-ink"
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {running.perTask && running.kind === "paid" && (
        <label className={fieldLabel}>
          {t.timer.units}
          <input name="units" inputMode="numeric" pattern="[0-9]*" placeholder="0" className={`${fieldInput} font-mono`} />
          <span className="text-[12px] font-normal text-muted">{t.timer.unitsHint}</span>
        </label>
      )}

      {long && (
        <div role="alert" className="flex flex-col gap-1.5 rounded-[12px] bg-amber-tint px-4 py-3 text-amber-ink">
          <strong className="text-[15px]">{t.timer.longTitle}</strong>
          <span className="text-[14px]">{t.timer.longText}</span>
          <Link href={`/app/registro/${running.id}`} className="text-[14px] font-bold text-amber-ink">
            {t.timer.adjust}
          </Link>
        </div>
      )}

      {(switchState?.error || stopState?.error) && (
        <p role="alert" className="m-0 text-[14px] font-semibold text-amber-ink">
          {t.common.genericError}
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {long && !confirming ? (
          <button type="button" onClick={() => setConfirming(true)} className={`${bigButton} bg-ink text-white`}>
            <span aria-hidden="true">■</span> {t.timer.stop}
          </button>
        ) : (
          <button type="submit" formAction={stopAction} disabled={pending} className={`${bigButton} bg-ink text-white`}>
            <span aria-hidden="true">■</span> {long ? t.timer.stopAnyway : t.timer.stop}
          </button>
        )}
        {/* Time without a client can't become paid. */}
        {(running.sourceId || other === "unpaid") && (
          <button type="submit" name="target" value={`${other}:${firstOther?.id ?? ""}`} disabled={pending} className={secondaryButton}>
            {t.timer.switchTo[other]}
          </button>
        )}
      </div>
    </form>
  );
}

export type TodayRow = { sourceId: string | null; name: string; paidMs: number; unpaidMs: number };

// Today's hours per platform. The running entry keeps adding to its platform's total.
export function TodayTotals({
  t,
  locale,
  rows,
  running,
  dayStart,
  serverNow,
}: {
  t: AppDictionary;
  locale: string;
  rows: TodayRow[];
  running: RunningEntry | null;
  dayStart: number;
  serverNow: number;
}) {
  const now = useNow(serverNow, 30_000);
  const live = rows.map((r) => {
    if (!running || running.sourceId !== r.sourceId) return r;
    const ms = Math.max(0, now - Math.max(running.startedAt, dayStart));
    return running.kind === "paid" ? { ...r, paidMs: r.paidMs + ms } : { ...r, unpaidMs: r.unpaidMs + ms };
  });
  const paid = live.reduce((sum, r) => sum + r.paidMs, 0);
  const unpaid = live.reduce((sum, r) => sum + r.unpaidMs, 0);

  if (!live.length) return <p className="m-0 text-[14px] text-muted">{t.today.nothingYet}</p>;
  // "2h pagas · 1h não pagas", leaving out a zero unpaid part.
  const detail = (p: number, u: number) =>
    [t.today.paid.replace("{h}", formatDuration(p, locale)), u > 0 ? t.today.unpaid.replace("{h}", formatDuration(u, locale)) : null]
      .filter(Boolean)
      .join(" · ");

  return (
    <div className="flex flex-col gap-3">
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {live.map((r) => (
          <li key={r.sourceId ?? NO_CLIENT} className="flex flex-col gap-2 rounded-[12px] bg-paper px-4 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-[15px] font-bold">{r.name}</span>
              <span className="font-mono text-[15px] font-semibold">{formatDuration(r.paidMs + r.unpaidMs, locale)}</span>
            </div>
            <SplitBar paid={r.paidMs} unpaid={r.unpaidMs} />
            <span className="text-[13px] text-ink-soft">{detail(r.paidMs, r.unpaidMs)}</span>
          </li>
        ))}
      </ul>
      {live.length > 1 && (
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-1 text-[14px]">
          <span className="font-bold">{t.today.total}</span>
          <span className="text-ink-soft">
            <span className="font-mono font-semibold text-ink">{formatDuration(paid + unpaid, locale)}</span> · {detail(paid, unpaid)}
          </span>
        </div>
      )}
      <SplitLegend t={t} />
    </div>
  );
}
