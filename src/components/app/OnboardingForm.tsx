"use client";

import { useActionState } from "react";
import { completeOnboarding, type FormState } from "@/app/app/actions";
import type { AppDictionary } from "@/i18n/app";
import { WORK_TYPES } from "@/lib/app/sources";
import { SourceFields, fieldInput, fieldLabel } from "./SourceFields";
import { FormMessage, SubmitButton } from "./ui";

export function OnboardingForm({ t, defaultWork }: { t: AppDictionary; defaultWork: string | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(completeOnboarding, null);
  return (
    <form action={action} className="flex flex-col gap-6">
      <label className={fieldLabel}>
        {t.onboarding.workQuestion}
        <select name="work_type" defaultValue={defaultWork ?? "ai"} className={fieldInput}>
          {WORK_TYPES.map((w) => (
            <option key={w} value={w}>{t.work[w]}</option>
          ))}
        </select>
      </label>
      <div className="flex flex-col gap-1">
        <h2 className="m-0 text-[18px] font-bold">{t.onboarding.sourceTitle}</h2>
        <p className="m-0 text-[14px] text-ink-soft">{t.onboarding.sourceLead}</p>
      </div>
      <SourceFields t={t} />
      <FormMessage t={t} state={state} />
      <SubmitButton pending={pending} label={t.onboarding.finish} pendingLabel={t.common.saving} />
    </form>
  );
}
