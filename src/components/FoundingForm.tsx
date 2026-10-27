"use client";

import { useActionState } from "react";
import { type FoundingState, startFoundingCheckout } from "@/app/fundador/actions";
import type { Locale } from "@/i18n/config";
import type { FoundingDictionary } from "@/i18n/founding";

// Email, then off to Mercado Pago. The hidden "website" field catches bots.
export function FoundingForm({ t, locale }: { t: FoundingDictionary; locale: Locale }) {
  const [state, action, pending] = useActionState<FoundingState, FormData>(startFoundingCheckout, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <label className="flex flex-col gap-1.5 text-[15px] font-bold text-ink">
        {t.email}
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          maxLength={254}
          className="min-h-12 w-full rounded-[10px] border border-field bg-white px-3.5 font-sans text-[16px] font-medium text-ink"
        />
        <span className="text-[13px] font-normal text-muted">{t.emailHint}</span>
      </label>
      {state?.error && (
        <p role="alert" className="m-0 text-[14px] font-semibold text-amber-ink">
          {t.errors[state.error]}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 cursor-pointer self-start rounded-[10px] border-0 bg-brand px-6 font-sans text-[16px] font-bold text-white disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? t.paying : t.button}
      </button>
    </form>
  );
}
