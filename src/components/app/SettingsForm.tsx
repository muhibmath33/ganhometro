"use client";

import { useActionState } from "react";
import { type FormState, saveSettings } from "@/app/app/actions";
import type { AppDictionary } from "@/i18n/app";
import type { Locale } from "@/i18n/config";
import { WORK_TYPES } from "@/lib/app/sources";
import { fieldInput, fieldLabel } from "./SourceFields";
import { FormMessage, SubmitButton } from "./ui";

export function SettingsForm({ t, locale, work }: { t: AppDictionary; locale: Locale; work: string | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveSettings, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className={fieldLabel}>
        {t.settings.language}
        <select name="locale" defaultValue={locale} className={fieldInput}>
          {(["pt-BR", "en"] as const).map((l) => (
            <option key={l} value={l}>{t.settings.languages[l]}</option>
          ))}
        </select>
      </label>
      <label className={fieldLabel}>
        {t.settings.work}
        <select name="work_type" defaultValue={work ?? "other"} className={fieldInput}>
          {WORK_TYPES.map((w) => (
            <option key={w} value={w}>{t.work[w]}</option>
          ))}
        </select>
      </label>
      <FormMessage t={t} state={state} okText={t.settings.saved} />
      <SubmitButton pending={pending} label={t.common.save} pendingLabel={t.common.saving} />
    </form>
  );
}
