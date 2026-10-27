import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { getAppDictionary } from "@/i18n/app";
import { alternates, fill, type Locale, routes } from "@/i18n/config";
import { getFoundingDictionary } from "@/i18n/founding";
import { dayKey } from "@/lib/app/time";
import { billingConfigured } from "@/lib/billing/mercadopago";
import { foundingOpen } from "@/lib/billing/plans";
import { processPayment } from "@/lib/billing/process";
import { formatDay } from "./calculators/shared";
import { FoundingForm } from "./FoundingForm";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function foundingMetadata(locale: Locale): Metadata {
  const t = getFoundingDictionary(locale);
  return { title: t.metaTitle, description: t.metaDescription, alternates: alternates("founding", locale), robots: { index: false, follow: true } };
}

type Search = Promise<Record<string, string | string[] | undefined>>;

async function Offer({ locale, searchParams }: { locale: Locale; searchParams: Search }) {
  const t = getFoundingDictionary(locale);
  // Request time only: whether the offer is open depends on today's date.
  await connection();
  const params = await searchParams;
  // Back from Mercado Pago: confirm the payment with them now (the notification may still be on its way).
  const paymentId = typeof params.payment_id === "string" && /^\d{1,24}$/.test(params.payment_id) ? params.payment_id : null;
  const returned = paymentId ? await processPayment(paymentId).catch(() => null) : null;
  const open = billingConfigured() && foundingOpen(dayKey(new Date(), "America/Sao_Paulo"), process.env.FOUNDING_UNTIL);

  const result =
    returned?.status === "approved"
      ? fill(t.results.approved, { email: returned.checkout.email ?? "" })
      : returned && (returned.status === "pending" || returned.status === "in_process")
        ? t.results.pending
        : paymentId || params.status === "failure" || params.status === "rejected"
          ? t.results.failure
          : null;

  return (
    <>
      {result && (
        <p role="status" className="m-0 rounded-[12px] bg-brand-tint px-4 py-3 text-[15px] font-semibold text-brand">
          {result}
        </p>
      )}
      {returned?.status === "approved" ? null : open ? (
        <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6">
          <FoundingForm t={t} locale={locale} />
          <p className="m-0 text-[13px] text-muted">
            {t.secure}{" "}
            <Link href={routes.terms[locale]}>{t.terms}</Link>
          </p>
        </section>
      ) : (
        <p className="m-0 text-[16px] text-ink-soft">
          {t.closed} <Link href={routes.home[locale]}>{t.back}</Link>
        </p>
      )}
    </>
  );
}

export function FoundingPage({ locale, searchParams }: { locale: Locale; searchParams: Search }) {
  const t = getFoundingDictionary(locale);
  const features = getAppDictionary(locale).plans.features;
  const launch = process.env.LAUNCH_DATE && /^\d{4}-\d{2}-\d{2}$/.test(process.env.LAUNCH_DATE) ? formatDay(process.env.LAUNCH_DATE, locale) : null;
  return (
    <>
      <SiteHeader locale={locale} page="founding" />
      <main className="mx-auto flex max-w-[760px] flex-col gap-6 px-6 pt-12 pb-20">
        <div className="flex flex-col gap-3">
          <span className="self-start rounded-full bg-brand-tint px-3 py-1 text-[13px] font-bold text-brand">{t.badge}</span>
          <h1 className="m-0 text-[clamp(30px,7vw,42px)] leading-[1.1] font-extrabold tracking-[-0.025em]">{t.title}</h1>
          <p className="m-0 text-[17px] leading-[1.6] text-ink-soft">{launch ? fill(t.lead, { date: launch }) : t.leadNoDate}</p>
        </div>
        <Suspense fallback={<div className="h-48 rounded-2xl border border-line bg-white" />}>
          <Offer locale={locale} searchParams={searchParams} />
        </Suspense>
        <section className="flex flex-col gap-2">
          <h2 className="m-0 text-[20px] font-bold">{t.included}</h2>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[15px]">
            {features.map((f) => (
              <li key={f} className="flex items-baseline gap-2">
                <span aria-hidden="true" className="text-brand">
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
