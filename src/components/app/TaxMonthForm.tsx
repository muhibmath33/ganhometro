"use client";

import { useActionState } from "react";
import { type FormState, saveTaxMonth } from "@/app/app/actions";
import type { AppDictionary } from "@/i18n/app";
import { fieldInput, fieldLabel } from "./SourceFields";
import { FormMessage, SubmitButton } from "./ui";

export type TaxMonthValues = { month: string; inssPaid: string; dependents: string; alimony: string; other: string };

// A month's actual deductions. Empty INSS and dependents fall back to the estimate from Settings.
export function TaxMonthForm({ t, values }: { t: AppDictionary; values: TaxMonthValues }) {
  const m = t.taxMonth;
  const [state, action, pending] = useActionState<FormState, FormData>(saveTaxMonth, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="month" value={values.month} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] gap-4">
        <label className={fieldLabel}>
          {m.inssPaid}
          <input name="inss_paid" inputMode="decimal" defaultValue={values.inssPaid} className={`${fieldInput} font-mono`} />
        </label>
        <label className={fieldLabel}>
          {m.dependents}
          <input name="dependents" type="number" min={0} max={20} defaultValue={values.dependents} className={fieldInput} />
        </label>
        <label className={fieldLabel}>
          {m.alimony}
          <input name="alimony" inputMode="decimal" defaultValue={values.alimony} className={`${fieldInput} font-mono`} />
        </label>
        <label className={fieldLabel}>
          {m.other}
          <input name="other_deductions" inputMode="decimal" defaultValue={values.other} className={`${fieldInput} font-mono`} />
        </label>
      </div>
      <FormMessage t={t} state={state} okText={m.saved} />
      <SubmitButton pending={pending} label={t.common.save} pendingLabel={t.common.saving} />
    </form>
  );
}
