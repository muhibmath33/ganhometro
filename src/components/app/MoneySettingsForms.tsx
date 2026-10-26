"use client";

import { useActionState } from "react";
import { type FormState, saveDocSettings, saveEmailSettings, saveReserveSettings } from "@/app/app/actions";
import type { AppDictionary } from "@/i18n/app";
import { fieldInput, fieldLabel } from "./SourceFields";
import { FormMessage, SubmitButton } from "./ui";

const check = "flex min-h-11 cursor-pointer items-center gap-3 text-[15px] font-semibold text-ink";

export type ReserveValues = { salary: string; thirteenth: boolean; vacation: boolean; emergencyPct: string; emergencyMonths: string };

// The salary to pay yourself and what to set aside from what's left.
export function ReservesSettingsForm({ t, values }: { t: AppDictionary; values: ReserveValues }) {
  const s = t.settings;
  const [state, action, pending] = useActionState<FormState, FormData>(saveReserveSettings, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className={fieldLabel}>
        {s.salary}
        <input name="salary_target" inputMode="decimal" defaultValue={values.salary} placeholder="6.000" className={`${fieldInput} font-mono`} />
        <span className="text-[12px] font-normal text-muted">{s.salaryHint}</span>
      </label>
      <label className={check}>
        <input type="checkbox" name="reserve_13th" defaultChecked={values.thirteenth} className="size-5 accent-brand" />
        {s.thirteenth}
      </label>
      <label className={check}>
        <input type="checkbox" name="reserve_vacation" defaultChecked={values.vacation} className="size-5 accent-brand" />
        {s.vacation}
      </label>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4">
        <label className={fieldLabel}>
          {s.emergencyPct}
          <input name="emergency_pct" inputMode="decimal" defaultValue={values.emergencyPct} className={`${fieldInput} font-mono`} />
        </label>
        <label className={fieldLabel}>
          {s.emergencyMonths}
          <input name="emergency_months" type="number" min={0} max={24} defaultValue={values.emergencyMonths} className={fieldInput} />
        </label>
      </div>
      <FormMessage t={t} state={state} okText={s.saved} />
      <SubmitButton pending={pending} label={t.common.save} pendingLabel={t.common.saving} />
    </form>
  );
}

// Which emails to get.
export function EmailSettingsForm({ t, values }: { t: AppDictionary; values: { reminders: boolean; weekly: boolean } }) {
  const s = t.settings;
  const [state, action, pending] = useActionState<FormState, FormData>(saveEmailSettings, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <label className={check}>
        <input type="checkbox" name="email_reminders" defaultChecked={values.reminders} className="size-5 shrink-0 accent-brand" />
        {s.emailReminders}
      </label>
      <label className={check}>
        <input type="checkbox" name="email_weekly" defaultChecked={values.weekly} className="size-5 shrink-0 accent-brand" />
        {s.emailWeekly}
      </label>
      <FormMessage t={t} state={state} okText={s.saved} />
      <SubmitButton pending={pending} label={t.common.save} pendingLabel={t.common.saving} />
    </form>
  );
}

// The name and details printed on documents, and how clients pay (for invoices).
export function DocSettingsForm({ t, values }: { t: AppDictionary; values: { name: string; details: string; payment: string } }) {
  const s = t.settings;
  const hint = "text-[12px] font-normal text-muted";
  const [state, action, pending] = useActionState<FormState, FormData>(saveDocSettings, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className={fieldLabel}>
        {s.docName}
        <input name="doc_name" maxLength={100} defaultValue={values.name} autoComplete="name" className={fieldInput} />
      </label>
      <label className={fieldLabel}>
        <span>
          {s.docDetails} <span className={hint}>({t.common.optional})</span>
        </span>
        <textarea name="doc_details" rows={3} maxLength={600} defaultValue={values.details} className={`${fieldInput} py-2.5`} />
        <span className={hint}>{s.docDetailsHint}</span>
      </label>
      <label className={fieldLabel}>
        <span>
          {s.paymentInstructions} <span className={hint}>({t.common.optional})</span>
        </span>
        <textarea name="payment_instructions" rows={4} maxLength={1000} defaultValue={values.payment} className={`${fieldInput} py-2.5`} />
        <span className={hint}>{s.paymentInstructionsHint}</span>
      </label>
      <FormMessage t={t} state={state} okText={s.saved} />
      <SubmitButton pending={pending} label={t.common.save} pendingLabel={t.common.saving} />
    </form>
  );
}
