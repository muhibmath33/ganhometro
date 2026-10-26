"use client";

import { useActionState, useState } from "react";
import { type FormState, saveTaxSettings } from "@/app/app/actions";
import type { AppDictionary } from "@/i18n/app";
import { fieldInput, fieldLabel } from "./SourceFields";
import { Chip, FormMessage, legendClass, SubmitButton } from "./ui";

export type TaxSettings = { taxMode: "pf" | "cnpj"; inssPlan: string; dependents: number; accountantCost: number };

// How the person is paid, for the take-home and tax estimates.
export function TaxSettingsForm({ t, values }: { t: AppDictionary; values: TaxSettings }) {
  const s = t.settings;
  const [state, action, pending] = useActionState<FormState, FormData>(saveTaxSettings, null);
  const [mode, setMode] = useState(values.taxMode);
  return (
    <form action={action} className="flex flex-col gap-4">
      <fieldset className="m-0 border-0 p-0">
        <legend className={legendClass}>{s.taxMode}</legend>
        <div className="flex flex-wrap gap-2">
          {(["pf", "cnpj"] as const).map((m) => (
            <Chip key={m} name="tax_mode" value={m} checked={mode === m} onChange={() => setMode(m)}>
              {s.taxModes[m]}
            </Chip>
          ))}
        </div>
      </fieldset>
      {mode === "pf" ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4">
          <label className={fieldLabel}>
            {s.inss}
            <select name="inss_plan" defaultValue={values.inssPlan} className={fieldInput}>
              {(["full", "simplified", "none"] as const).map((p) => (
                <option key={p} value={p}>
                  {s.inssOptions[p]}
                </option>
              ))}
            </select>
          </label>
          <label className={fieldLabel}>
            {s.dependents}
            <input name="dependents" type="number" min={0} max={20} defaultValue={values.dependents} className={fieldInput} />
          </label>
        </div>
      ) : (
        <>
          <input type="hidden" name="inss_plan" value={values.inssPlan} />
          <input type="hidden" name="dependents" value={values.dependents} />
          <label className={fieldLabel}>
            {s.accountant}
            <input name="accountant_cost" inputMode="decimal" defaultValue={String(values.accountantCost).replace(".", ",")} className={fieldInput} />
          </label>
        </>
      )}
      {mode === "pf" && <input type="hidden" name="accountant_cost" value={values.accountantCost} />}
      <FormMessage t={t} state={state} okText={s.saved} />
      <SubmitButton pending={pending} label={t.common.save} pendingLabel={t.common.saving} />
    </form>
  );
}
