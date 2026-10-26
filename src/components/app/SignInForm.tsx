"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { requestCode, type SignInState, verifyCode } from "@/app/app/actions";
import type { AppDictionary } from "@/i18n/app";
import type { Locale } from "@/i18n/config";
import { routes } from "@/i18n/config";
import { fieldInput, fieldLabel } from "./SourceFields";
import { SubmitButton } from "./ui";

// Two steps: email → 6-digit code (the email also has a link that works on the same device).
export function SignInForm({ t, locale }: { t: AppDictionary; locale: Locale }) {
  const [requested, request, requesting] = useActionState<SignInState, FormData>(requestCode, { step: "email", email: "" });
  const [verified, verify, verifying] = useActionState<SignInState, FormData>(verifyCode, { step: "code", email: "" });
  // "Use another email" dismisses this request; a new request (a new state object) shows the code step again.
  const [dismissed, setDismissed] = useState<SignInState | null>(null);
  const s = t.signIn;
  const onCodeStep = requested.step === "code" && dismissed !== requested;
  const error = onCodeStep ? verified.error : requested.error;

  return (
    <div className="flex flex-col gap-4">
      {!onCodeStep ? (
        <form action={request} className="flex flex-col gap-4">
          <input type="hidden" name="locale" value={locale} />
          <label className={fieldLabel}>
            {s.email}
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={requested.email}
              placeholder="seu@email.com"
              className={fieldInput}
            />
          </label>
          <SubmitButton pending={requesting} label={s.send} pendingLabel={s.sending} />
        </form>
      ) : (
        <form action={verify} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="m-0 text-[18px] font-bold">{s.sentTitle}</h2>
            <p className="m-0 text-[14px] text-ink-soft">{s.sentLead.replace("{email}", requested.email)}</p>
          </div>
          <input type="hidden" name="email" value={requested.email} />
          <label className={fieldLabel}>
            {s.code}
            <input
              name="code"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]{6,7}"
              maxLength={7}
              placeholder="123456"
              className={`${fieldInput} font-mono text-[22px] tracking-[0.3em]`}
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton pending={verifying} label={s.verify} pendingLabel={s.verifying} />
            <button
              type="button"
              onClick={() => setDismissed(requested)}
              className="cursor-pointer border-0 bg-transparent font-sans text-[14px] font-semibold text-brand underline"
            >
              {s.otherEmail}
            </button>
          </div>
        </form>
      )}
      {error && (
        <p role="alert" className="m-0 text-[14px] font-semibold text-amber-ink">
          {s.errors[error]}
        </p>
      )}
      <p className="m-0 text-[12px] text-muted">
        {s.privacy}{" "}
        <Link href={routes.privacy[locale]} className="underline">
          {locale === "en" ? "Privacy" : "Privacidade"}
        </Link>
      </p>
    </div>
  );
}
