"use client";

import { useActionState, useMemo, useState } from "react";
import { importTimeEntries, type TimeImportState } from "@/app/app/actions";
import type { AppDictionary } from "@/i18n/app";
import { fill, type Locale } from "@/i18n/config";
import { NO_CLIENT } from "@/lib/app/entries";
import { formatDuration } from "@/lib/app/time";
import { groupOf, readTimesheet } from "@/lib/app/timeImport";
import { fieldInput, fieldLabel } from "./SourceFields";

const SKIP = "skip";

// Pick a Toggl or Clockify export, choose where each client's hours go, import. The file is read here; only
// times, the destination, the project name and a reference go to the server.
export function TimeImport({
  t,
  locale,
  timeZone,
  sources,
}: {
  t: AppDictionary;
  locale: Locale;
  timeZone: string;
  sources: { id: string; name: string }[];
}) {
  const s = t.timeImport;
  const [text, setText] = useState<string | null>(null);
  const [dayFirst, setDayFirst] = useState(locale !== "en");
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [nonBillableUnpaid, setNonBillableUnpaid] = useState(true);
  const [state, action, pending] = useActionState<TimeImportState, FormData>(importTimeEntries, null);
  const result = useMemo(() => (text === null ? null : readTimesheet(text, { dayFirst })), [text, dayFirst]);
  const hours = (minutes: number) => formatDuration(minutes * 60_000, locale);

  // Each client (or project, when there's no client) with its entries, in file order.
  const groups = useMemo(() => {
    const map = new Map<string, { count: number; minutes: number }>();
    for (const r of result?.rows ?? []) {
      const g = groupOf(r);
      const cur = map.get(g) ?? { count: 0, minutes: 0 };
      map.set(g, { count: cur.count + 1, minutes: cur.minutes + r.minutes });
    }
    return [...map];
  }, [result]);

  // A source with the same name as the group, else the first one; entries with no label go to "no client".
  const guess = (label: string) =>
    label ? (sources.find((src) => src.name.trim().toLowerCase() === label.trim().toLowerCase())?.id ?? sources[0]?.id ?? NO_CLIENT) : NO_CLIENT;
  const destination = (label: string) => mapping[label] ?? guess(label);

  const chosen = (result?.rows ?? [])
    .filter((r) => destination(groupOf(r)) !== SKIP)
    .map((r) => ({
      sd: r.startDay,
      st: r.startTime,
      ed: r.endDay,
      et: r.endTime,
      source: destination(groupOf(r)),
      project: r.project || null,
      paid: !(nonBillableUnpaid && r.billable === false),
      ref: r.ref,
    }));

  return (
    <div className="flex flex-col gap-4">
      <label className={fieldLabel}>
        {s.file}
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            setMapping({});
            setText(file ? await file.text() : null);
          }}
          className="min-h-12 w-full rounded-[10px] border border-field bg-white px-3 py-2.5 font-sans text-[15px] text-ink"
        />
      </label>

      {result && (
        <div role="status" className="flex flex-col gap-1 text-[14px] text-ink-soft">
          {result.rows.length ? (
            <span className="font-semibold text-ink">
              {fill(s.found, { format: s.formats[result.format], n: result.rows.length, hours: hours(result.rows.reduce((sum, r) => sum + r.minutes, 0)) })}
            </span>
          ) : (
            <span className="font-semibold text-amber-ink">{s.none}</span>
          )}
          {result.skipped > 0 && <span>{fill(s.skipped, { n: result.skipped })}</span>}
        </div>
      )}

      {result && result.rows.length > 0 && (
        <form action={action} className="flex flex-col gap-4">
          {result.ambiguousDates && (
            <label className={fieldLabel}>
              {s.dateOrder}
              <select value={dayFirst ? "dmy" : "mdy"} onChange={(e) => setDayFirst(e.target.value === "dmy")} className={fieldInput}>
                <option value="dmy">{s.dateOrders.dmy}</option>
                <option value="mdy">{s.dateOrders.mdy}</option>
              </select>
            </label>
          )}

          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="mb-1.5 text-[14px] font-bold text-ink">{s.groups}</legend>
            {groups.map(([label, g]) => (
              <div key={label || "-"} className="flex flex-wrap items-center gap-3 rounded-[12px] bg-paper px-4 py-3">
                <div className="flex min-w-0 flex-[1_1_180px] flex-col">
                  <span className="text-[15px] font-bold">{label || s.noLabel}</span>
                  <span className="text-[12px] text-muted">{fill(s.group, { n: g.count, hours: hours(g.minutes) })}</span>
                </div>
                <select
                  aria-label={`${s.groups}: ${label || s.noLabel}`}
                  value={destination(label)}
                  onChange={(e) => setMapping((m) => ({ ...m, [label]: e.target.value }))}
                  className="min-h-11 flex-[1_1_180px] rounded-[10px] border border-field bg-white px-3 font-sans text-[14px] text-ink"
                >
                  {sources.map((src) => (
                    <option key={src.id} value={src.id}>
                      {src.name}
                    </option>
                  ))}
                  <option value={NO_CLIENT}>{s.noClient}</option>
                  <option value={SKIP}>{s.skip}</option>
                </select>
              </div>
            ))}
          </fieldset>

          {result.rows.some((r) => r.billable === false) && (
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] font-semibold text-ink">
              <input type="checkbox" checked={nonBillableUnpaid} onChange={(e) => setNonBillableUnpaid(e.target.checked)} className="size-5 shrink-0 accent-brand" />
              {s.nonBillable}
            </label>
          )}
          <p className="m-0 text-[13px] text-ink-soft">
            {fill(s.timezone, { tz: timeZone })} {s.projects}
          </p>

          <input type="hidden" name="rows" value={JSON.stringify(chosen)} />
          {(state?.error || !chosen.length) && (
            <p role="alert" className="m-0 text-[14px] font-semibold text-amber-ink">
              {chosen.length ? t.common.genericError : s.nothing}
            </p>
          )}
          <button
            type="submit"
            disabled={pending || !chosen.length}
            className="min-h-12 cursor-pointer self-start rounded-[10px] border-0 bg-brand px-5 font-sans text-[16px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? s.importing : fill(s.submit, { n: chosen.length })}
          </button>
        </form>
      )}
    </div>
  );
}
