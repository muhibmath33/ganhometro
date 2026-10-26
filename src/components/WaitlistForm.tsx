"use client";

import Link from "next/link";
import { useState } from "react";
import type { Audience, Dictionary, Locale } from "@/i18n";
import { routes } from "@/i18n/config";
import { track } from "@/lib/analytics";
import { site } from "@/lib/site";
import { getUtm } from "@/lib/utm";
import { CheckIcon, DownloadIcon } from "./icons";

type Props = {
  source: "hero" | "final";
  locale: Locale;
  audience: Audience;
  t: Dictionary["form"];
  buttonLabel: string;
  successText: string;
  centered?: boolean;
};

type ErrorCode = keyof Dictionary["form"]["errors"];
type WorkType = keyof Dictionary["form"]["workOptions"];

export function WaitlistForm({ source, locale, audience, t, buttonLabel, successText, centered = false }: Props) {
  const [email, setEmail] = useState("");
  const [work, setWork] = useState<WorkType | "">(""); // optional: tells us which audiences sign up
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [doubleOptIn, setDoubleOptIn] = useState(false);
  const [error, setError] = useState<ErrorCode | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatus("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent, source, locale, landing: audience, work, website, utm: getUtm() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setStatus("idle");
        setError(data.code in t.errors ? data.code : "generic");
        return;
      }
      setDoubleOptIn(Boolean(data.doubleOptIn));
      setStatus("done");
      track("Signup", { source, locale, landing: audience, work: work || "none" });
    } catch {
      setStatus("idle");
      setError("generic");
    }
  }

  if (status === "done") {
    return (
      <div className={`flex flex-col gap-2.5 ${centered ? "items-center" : "items-start"}`}>
        <div
          role="status"
          className="flex min-h-[52px] items-center gap-2.5 rounded-[10px] bg-brand-tint px-4 text-left text-[16px] font-bold text-brand"
        >
          <CheckIcon strokeWidth={2.4} className="shrink-0" />
          {doubleOptIn ? t.doubleOptIn : successText}
        </div>
        {site.bonus.ready &&
          [
            { href: site.bonus.href, label: t.bonus, file: "spreadsheet" },
            { href: site.bonus.guideHref, label: t.bonusGuide, file: "guide" },
          ].map((b) => (
            <a
              key={b.file}
              href={b.href}
              download
              onClick={() => track("Bonus download", { source, locale, file: b.file })}
              className="flex min-h-12 items-center gap-2.5 rounded-[10px] border border-brand bg-white px-4 py-2.5 text-left text-[15px] font-bold text-brand no-underline"
            >
              <DownloadIcon strokeWidth={2.2} className="shrink-0" />
              {b.label}
            </a>
          ))}
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
          {t.emailLabel}
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={t.placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-[52px] flex-[1_1_260px] rounded-[10px] border border-field bg-white px-4 font-sans text-[16px] font-medium text-ink"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="min-h-[52px] flex-none cursor-pointer rounded-[10px] border-0 bg-brand px-[22px] font-sans text-[16px] font-bold text-white disabled:cursor-wait disabled:opacity-70"
        >
          {status === "sending" ? t.sending : buttonLabel}
        </button>
      </div>
      <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-left ${centered ? "justify-center" : ""}`}>
        <label htmlFor={`work-${source}`} className="text-[13px] font-semibold text-ink-soft">
          {t.workLabel}
        </label>
        <select
          id={`work-${source}`}
          name="work"
          value={work}
          onChange={(e) => setWork(e.target.value as WorkType | "")}
          className="min-h-11 flex-[1_1_220px] cursor-pointer rounded-[10px] border border-field bg-white px-3 font-sans text-[15px] text-ink"
        >
          <option value="">{t.workPlaceholder}</option>
          {(Object.keys(t.workOptions) as WorkType[]).map((key) => (
            <option key={key} value={key}>
              {t.workOptions[key]}
            </option>
          ))}
        </select>
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
          {t.consentBefore}
          <Link href={routes.privacy[locale]} className="underline">
            {t.consentLink}
          </Link>
          {t.consentAfter}
        </span>
      </label>
      {/* Honeypot: hidden from people, often filled by bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label htmlFor={`website-${source}`}>{t.honeypot}</label>
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
          {t.errors[error]}
        </p>
      )}
    </form>
  );
}
