"use client";

import { useActionState, useState } from "react";
import { type ProjectFormState, saveProject } from "@/app/app/actions";
import type { AppDictionary } from "@/i18n/app";
import { type Project, PROJECT_PAYS } from "@/lib/app/projects";
import { currencySymbol } from "@/lib/app/sources";
import { fieldInput, fieldLabel } from "./SourceFields";
import { Chip, FormMessage, legendClass, SubmitButton } from "./ui";

const decimal = (n: number | null) => (n === null ? "" : String(n).replace(".", ","));

// Add a project to a client (no project), or edit one.
export function ProjectForm({ t, sourceId, currency, project }: { t: AppDictionary; sourceId: string; currency: string; project?: Project }) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(saveProject, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="source_id" value={sourceId} />
      {project && <input type="hidden" name="id" value={project.id} />}
      {/* Remount after a successful add (the server stamps each save) so the fields reset. */}
      <ProjectFields key={state?.savedAt ?? "fields"} t={t} currency={currency} project={project} />
      <FormMessage t={t} state={state} okText={project ? t.source.saved : t.project.added} errors={t.project.errors} />
      <SubmitButton pending={pending} label={project ? t.common.save : t.project.add} pendingLabel={t.common.saving} />
    </form>
  );
}

function ProjectFields({ t, currency, project }: { t: AppDictionary; currency: string; project?: Project }) {
  const [pay, setPay] = useState<(typeof PROJECT_PAYS)[number]>(
    project?.pay_model === "hourly" || project?.pay_model === "fixed" ? project.pay_model : "same",
  );
  const p = t.project;
  const symbol = currencySymbol(currency);
  return (
    <>
      <label className={fieldLabel}>
        {p.name}
        <input name="name" required maxLength={60} defaultValue={project?.name ?? ""} className={fieldInput} />
      </label>
      <fieldset className="m-0 border-0 p-0">
        <legend className={legendClass}>{p.pay}</legend>
        <div className="flex flex-wrap gap-2">
          {PROJECT_PAYS.map((k) => (
            <Chip key={k} name="pay" value={k} checked={pay === k} onChange={() => setPay(k)}>
              {p.pays[k]}
            </Chip>
          ))}
        </div>
      </fieldset>
      {pay === "hourly" && (
        <label className={fieldLabel}>
          {p.rate} ({symbol})
          <input name="rate" inputMode="decimal" required defaultValue={decimal(project?.rate ?? null)} placeholder="40,00" className={`${fieldInput} font-mono`} />
        </label>
      )}
      {pay === "fixed" && (
        <label className={fieldLabel}>
          {p.price} ({symbol})
          <input
            name="fixed_price"
            inputMode="decimal"
            required
            defaultValue={decimal(project?.fixed_price ?? null)}
            placeholder="1.500,00"
            className={`${fieldInput} font-mono`}
          />
        </label>
      )}
    </>
  );
}
