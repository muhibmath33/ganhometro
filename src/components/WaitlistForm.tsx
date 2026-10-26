"use client";

import Link from "next/link";
import { useState } from "react";
import { track } from "@/lib/analytics";
import { getUtm } from "@/lib/utm";
import { CheckIcon } from "./icons";

type Props = {
  source: "hero" | "final";
  buttonLabel: string;
  successText: string;
  centered?: boolean;
};

const GENERIC_ERROR = "Não foi possível enviar agora. Tente de novo em instantes.";

export function WaitlistForm({ source, buttonLabel, successText, centered = false }: Props) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [doubleOptIn, setDoubleOptIn] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setStatus("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent, source, website, utm: getUtm() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || GENERIC_ERROR);
      setDoubleOptIn(Boolean(data.doubleOptIn));
      setStatus("done");
      track("Signup", { source });
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error && err.message ? err.message : GENERIC_ERROR);
    }
  }

  if (status === "done") {
    return (
      <div
        role="status"
        className="flex min-h-[52px] items-center gap-2.5 rounded-[10px] bg-brand-tint px-4 text-left text-[16px] font-bold text-brand"
      >
        <CheckIcon strokeWidth={2.4} className="shrink-0" />
        {doubleOptIn
          ? "Quase lá! Confirme sua inscrição no e-mail que acabamos de enviar."
          : successText}
      </div>
    );
  }

  const emailId = `email-${source}`;
  const consentId = `consent-${source}`;

  return (
    <form
      onSubmit={onSubmit}
      className={`relative flex w-full flex-col gap-2.5 ${centered ? "max-w-[520px]" : ""}`}
    >
      <div className={`flex flex-wrap gap-2.5 ${centered ? "justify-center" : ""}`}>
        <label htmlFor={emailId} className="sr-only">
          Seu e-mail
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-[52px] flex-[1_1_260px] rounded-[10px] border border-field bg-white px-4 font-sans text-[16px] font-medium text-ink"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="min-h-[52px] flex-none cursor-pointer rounded-[10px] border-0 bg-brand px-[22px] font-sans text-[16px] font-bold text-white disabled:cursor-wait disabled:opacity-70"
        >
          {status === "sending" ? "Enviando…" : buttonLabel}
        </button>
      </div>
      <label
        htmlFor={consentId}
        className="flex items-start gap-2 text-left text-[13px] leading-[1.5] text-muted"
      >
        <input
          id={consentId}
          name="consent"
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-px size-4 shrink-0 cursor-pointer accent-brand"
        />
        <span>
          Aceito receber e-mails do Ganho Real sobre o acesso antecipado e a oferta de
          fundador. Li a <Link href="/privacidade" className="underline">Política de Privacidade</Link> e
          posso cancelar quando quiser.
        </span>
      </label>
      {/* Honeypot: hidden from people, often filled by bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label htmlFor={`website-${source}`}>Não preencha este campo</label>
        <input
          id={`website-${source}`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>
      {error && (
        <p role="alert" className="m-0 text-left text-[14px] font-semibold text-amber-ink">
          {error}
        </p>
      )}
    </form>
  );
}
