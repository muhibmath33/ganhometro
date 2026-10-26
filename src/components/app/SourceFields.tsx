"use client";

import { useState } from "react";
import type { AppDictionary } from "@/i18n/app";
import type { Source } from "@/lib/app/sources";
import { CURRENCIES, KINDS, PAY_MODELS, SCHEDULES } from "@/lib/app/sources";

export const fieldLabel = "flex flex-col gap-1.5 text-[14px] font-bold text-ink";
export const fieldInput =
  "min-h-12 w-full rounded-[10px] border border-field bg-white px-3.5 font-sans text-[16px] font-medium text-ink";
const hint = "text-[12px] font-normal text-muted";

// The fields for a platform or client. Shows only what applies to the chosen pay model and schedule.
export function SourceFields({ t, source }: { t: AppDictionary; source?: Source }) {
  const [kind, setKind] = useState<(typeof KINDS)[number]>(source?.kind ?? "platform");
  const [payModel, setPayModel] = useState<(typeof PAY_MODELS)[number]>(source?.pay_model ?? "hourly");
  const [schedule, setSchedule] = useState<(typeof SCHEDULES)[number]>(source?.pay_schedule ?? "weekly");
  const s = t.source;

  return (
    <div className="grid gap-4">
      {source && <input type="hidden" name="id" value={source.id} />}

      <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
        <legend className="mb-1.5 text-[14px] font-bold text-ink">{s.kind}</legend>
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <label
              key={k}
              className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-[10px] border px-3.5 text-[15px] font-semibold ${
                kind === k ? "border-brand bg-brand-tint text-brand" : "border-field bg-white text-ink"
              }`}
            >
              <input
                type="radio"
                name="kind"
                value={k}
                checked={kind === k}
                onChange={() => {
                  setKind(k);
                  if (!source) setSchedule(k === "client" ? "on_invoice" : "weekly");
                }}
                className="accent-brand"
              />
              {s.kinds[k]}
            </label>
          ))}
        </div>
      </fieldset>

      <label className={fieldLabel}>
        {s.name}
        <input name="name" required maxLength={60} defaultValue={source?.name ?? ""} placeholder={s.namePlaceholder} className={fieldInput} />
      </label>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4">
        <label className={fieldLabel}>
          {s.payModel}
          <select name="pay_model" value={payModel} onChange={(e) => setPayModel(e.target.value as typeof payModel)} className={fieldInput}>
            {PAY_MODELS.map((m) => (
              <option key={m} value={m}>{s.payModels[m]}</option>
            ))}
          </select>
        </label>
        {payModel !== "fixed" && (
          <label className={fieldLabel}>
            {payModel === "per_task" ? s.ratePerTask : s.rateHourly}
            <input
              name="rate"
              inputMode="decimal"
              required
              defaultValue={source?.rate !== null && source?.rate !== undefined ? String(source.rate).replace(".", ",") : ""}
              placeholder="25,00"
              className={`${fieldInput} font-mono`}
            />
          </label>
        )}
        <label className={fieldLabel}>
          {s.currency}
          <select name="currency" defaultValue={source?.currency ?? "USD"} className={fieldInput}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>

      {kind === "platform" && (
        <label className={fieldLabel}>
          <span>
            {s.commission} <span className={hint}>({t.common.optional})</span>
          </span>
          <input
            name="commission_pct"
            inputMode="decimal"
            defaultValue={source?.commission_pct !== null && source?.commission_pct !== undefined ? String(source.commission_pct).replace(".", ",") : ""}
            placeholder="0"
            className={`${fieldInput} font-mono`}
          />
          <span className={hint}>{s.commissionHint}</span>
        </label>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4">
        <label className={fieldLabel}>
          {s.schedule}
          <select name="pay_schedule" value={schedule} onChange={(e) => setSchedule(e.target.value as typeof schedule)} className={fieldInput}>
            {SCHEDULES.map((sc) => (
              <option key={sc} value={sc}>{s.schedules[sc]}</option>
            ))}
          </select>
        </label>
        {(schedule === "weekly" || schedule === "biweekly") && (
          <label className={fieldLabel}>
            {s.weekday}
            <select name="pay_weekday" defaultValue={String(source?.pay_weekday ?? 3)} className={fieldInput}>
              {s.weekdays.map((d, i) => (
                <option key={d} value={i}>{d}</option>
              ))}
            </select>
          </label>
        )}
        {schedule === "monthly" && (
          <label className={fieldLabel}>
            {s.payDay}
            <input name="pay_day" type="number" min={1} max={31} required defaultValue={source?.pay_day ?? 5} className={fieldInput} />
          </label>
        )}
        {schedule === "on_invoice" && (
          <label className={fieldLabel}>
            {s.terms}
            <input name="payment_terms_days" type="number" min={0} max={180} defaultValue={source?.payment_terms_days ?? 30} className={fieldInput} />
            <span className={hint}>{s.termsHint}</span>
          </label>
        )}
      </div>
    </div>
  );
}
