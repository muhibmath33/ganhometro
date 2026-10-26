"use client";

import { useState } from "react";

// Two steps, so a stray tap doesn't delete anything. action is a server action that reads the "id" field.
export function ConfirmDelete({
  action,
  id,
  labels,
}: {
  action: (form: FormData) => void | Promise<void>;
  id: string;
  labels: { button: string; question: string; confirm: string; cancel: string };
}) {
  const [confirming, setConfirming] = useState(false);
  const button = "min-h-11 cursor-pointer rounded-[10px] border px-4 font-sans text-[14px] font-semibold";
  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className={`${button} self-start border-line bg-white text-amber-ink`}>
        {labels.button}
      </button>
    );
  }
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <span role="alert" className="w-full text-[14px] font-semibold text-amber-ink">
        {labels.question}
      </span>
      <button type="submit" className={`${button} border-amber bg-amber text-white`}>
        {labels.confirm}
      </button>
      <button type="button" onClick={() => setConfirming(false)} className={`${button} border-line bg-white text-ink`}>
        {labels.cancel}
      </button>
    </form>
  );
}
