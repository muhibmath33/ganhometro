"use client";

import { useActionState } from "react";
import { type FormState, saveSource } from "@/app/app/actions";
import type { AppDictionary } from "@/i18n/app";
import type { Source } from "@/lib/app/sources";
import { SourceFields } from "./SourceFields";
import { FormMessage, SubmitButton } from "./ui";

// Add (no source) or edit (with source) a platform or client.
export function SourceForm({ t, source }: { t: AppDictionary; source?: Source }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveSource, null);
  return (
    // Remount after a successful add (the server stamps each save) so the fields reset.
    <form key={state?.savedAt ?? "form"} action={action} className="flex flex-col gap-4">
      <SourceFields t={t} source={source} />
      <FormMessage t={t} state={state} okText={source ? t.source.saved : t.source.added} />
      <SubmitButton pending={pending} label={source ? t.common.save : t.source.add} pendingLabel={t.common.saving} />
    </form>
  );
}
