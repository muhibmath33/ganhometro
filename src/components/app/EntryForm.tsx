"use client";

import { useActionState, useState } from "react";
import { type EntryFormState, saveEntry } from "@/app/app/actions";
import type { AppDictionary } from "@/i18n/app";
import { type Category, type EntryKind, NO_CLIENT } from "@/lib/app/entries";
import { fieldInput, fieldLabel } from "./SourceFields";
import type { TimerSource } from "./Timer";
import { Chip, FormMessage, legendClass, SubmitButton } from "./ui";

// Dates and times are on the user's clock, prepared by the server.
export type EntryValues = {
  id?: string;
  sourceId: string; // NO_CLIENT for time without a client
  projectId: string | null;
  kind: EntryKind;
  categoryId: string | null;
  date: string;
  start: string;
  end: string;
  units: number | null;
  running: boolean;
};

const hint = "text-[12px] font-normal text-muted";

// Add hours that weren't tracked (no id), or fix an entry (with id).
export function EntryForm({
  t,
  sources,
  categories,
  values,
  maxDate,
}: {
  t: AppDictionary;
  sources: TimerSource[];
  categories: Category[];
  values: EntryValues;
  maxDate: string;
}) {
  const [state, action, pending] = useActionState<EntryFormState, FormData>(saveEntry, null);
  const [sourceId, setSourceId] = useState(values.sourceId);
  const [chosenKind, setKind] = useState(values.kind);
  const noClient = sourceId === NO_CLIENT;
  // Time without a client is always unpaid.
  const kind = noClient ? "unpaid" : chosenKind;
  const ofKind = categories.filter((c) => c.kind === kind);
  const source = sources.find((s) => s.id === sourceId);
  const perTask = source?.perTask ?? false;
  const projects = source?.projects ?? [];

  return (
    // Remount after a successful add (the server stamps each save) so the fields reset.
    <form key={state?.savedAt ?? "form"} action={action} className="flex flex-col gap-4">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <label className={fieldLabel}>
        {t.entry.source}
        <select name="source_id" value={sourceId} onChange={(e) => setSourceId(e.target.value)} className={fieldInput}>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
          <option value={NO_CLIENT}>{t.entry.noClient}</option>
        </select>
      </label>

      {projects.length > 0 && (
        // Keyed by source: another client starts with no project.
        <label key={sourceId} className={fieldLabel}>
          {t.entry.project}
          <select name="project_id" defaultValue={sourceId === values.sourceId ? (values.projectId ?? "") : ""} className={fieldInput}>
            <option value="">{t.entry.noProject}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {noClient ? (
        <>
          <input type="hidden" name="kind" value="unpaid" />
          <p className="m-0 rounded-[12px] bg-amber-tint px-4 py-3 text-[14px] text-amber-ink">{t.timer.noClientNote}</p>
        </>
      ) : (
        <fieldset className="m-0 border-0 p-0">
          <legend className={legendClass}>{t.entry.kind}</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["paid", "unpaid"] as const).map((k) => (
              <Chip key={k} name="kind" value={k} tone={k} checked={kind === k} onChange={() => setKind(k)}>
                {t.kinds[k]}
              </Chip>
            ))}
          </div>
        </fieldset>
      )}

      <label className={fieldLabel}>
        {t.entry.category}
        {/* Keyed by kind: switching paid/unpaid resets the choice to that kind's first category. */}
        <select
          key={kind}
          name="category_id"
          defaultValue={kind === values.kind ? (values.categoryId ?? "") : (ofKind[0]?.id ?? "")}
          className={fieldInput}
        >
          {ofKind.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value="">{t.entry.noCategory}</option>
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className={`${fieldLabel} col-span-2 sm:col-span-1`}>
          {t.entry.date}
          <input type="date" name="date" required max={maxDate} defaultValue={values.date} className={fieldInput} />
        </label>
        <label className={fieldLabel}>
          {t.entry.start}
          <input type="time" name="start" required defaultValue={values.start} className={`${fieldInput} font-mono`} />
        </label>
        <label className={fieldLabel}>
          {t.entry.end}
          <input type="time" name="end" required={!values.running} defaultValue={values.end} className={`${fieldInput} font-mono`} />
        </label>
      </div>
      <span className={`${hint} -mt-2`}>{values.running ? t.entry.endRunningHint : t.entry.endHint}</span>

      {perTask && kind === "paid" && (
        <label className={fieldLabel}>
          <span>
            {t.entry.units} <span className={hint}>({t.common.optional})</span>
          </span>
          <input
            name="units"
            inputMode="numeric"
            pattern="[0-9]*"
            defaultValue={values.units ?? ""}
            placeholder="0"
            className={`${fieldInput} font-mono`}
          />
        </label>
      )}

      <FormMessage t={t} state={state} okText={t.entry.added} errors={t.entry.errors} />
      <SubmitButton pending={pending} label={values.id ? t.common.save : t.entry.add} pendingLabel={t.common.saving} />
    </form>
  );
}
