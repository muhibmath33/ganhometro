// The free calculator pages, in both languages. Page files in src/app only pick the language.
import type { Metadata } from "next";
import Link from "next/link";
import { alternates, getDictionary, type Locale, routes } from "@/i18n";
import { getCalculatorsDictionary } from "@/i18n/calculators";
import { brazilMonth, carneLeaoRate, latestRates } from "@/lib/money/ptax";
import { SiteFooter } from "../SiteFooter";
import { SiteHeader } from "../SiteHeader";
import { WaitlistForm } from "../WaitlistForm";
import { CarneLeaoCalculator } from "./CarneLeaoCalculator";
import { CompanyCalculator } from "./CompanyCalculator";
import { TakeHomeCalculator } from "./TakeHomeCalculator";

type CalcKey = "calcTakeHome" | "calcCompany" | "calcCarneLeao";
const META_KEY = { calculators: "index", calcTakeHome: "takeHome", calcCompany: "company", calcCarneLeao: "carneLeao" } as const;
const LANDING: Record<CalcKey, string> = { calcTakeHome: "calc_take_home", calcCompany: "calc_company", calcCarneLeao: "calc_carne_leao" };

const badge = "self-start rounded-full bg-brand-tint px-3 py-1.5 text-[13px] font-bold text-brand";
const h2 = "m-0 text-[26px] font-extrabold tracking-[-0.02em]";

export function calculatorMetadata(page: keyof typeof META_KEY, locale: Locale): Metadata {
  const meta = getCalculatorsDictionary(locale)[META_KEY[page]].meta;
  return {
    title: meta.title,
    description: meta.description,
    openGraph: { title: meta.title, description: meta.description },
    alternates: alternates(page, locale),
  };
}

// The other calculators, plus the real-rate calculator on the home page.
function Related({ locale, current }: { locale: Locale; current?: CalcKey }) {
  const t = getCalculatorsDictionary(locale);
  const cards = [
    ...(["calcTakeHome", "calcCompany", "calcCarneLeao"] as const)
      .filter((k) => k !== current)
      .map((k) => ({ key: k, href: routes[k][locale], ...t.index.cards[k] })),
    { key: "realRate", href: `${routes.home[locale]}#calculadora`, ...t.index.cards.realRate },
  ];
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-4">
      {cards.map((card) => (
        <Link
          key={card.key}
          href={card.href}
          className="flex flex-col gap-2 rounded-[14px] border border-line bg-white p-5 text-ink no-underline hover:border-brand hover:text-ink"
        >
          <span className="text-[17px] font-bold">{card.title}</span>
          <span className="text-[14px] leading-[1.5] text-ink-soft">{card.text}</span>
          <span className="mt-auto text-[14px] font-bold text-brand">{t.index.open} →</span>
        </Link>
      ))}
    </div>
  );
}

function CalculatorShell({
  locale,
  page,
  title,
  lead,
  how,
  extra,
  children,
}: {
  locale: Locale;
  page: CalcKey;
  title: string;
  lead: string;
  how: string[];
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  const t = getCalculatorsDictionary(locale);
  const form = getDictionary(locale).form;
  return (
    <>
      <SiteHeader locale={locale} page={page} />
      <main>
        <section className="mx-auto flex max-w-[1120px] flex-col gap-6 px-6 pt-12 pb-14">
          <div className="flex max-w-[760px] flex-col gap-3">
            <span className={badge}>{t.common.badge}</span>
            <h1 className="m-0 text-[clamp(32px,8vw,44px)] leading-[1.1] font-extrabold tracking-[-0.025em]">{title}</h1>
            <p className="m-0 text-[17px] leading-[1.6] text-ink-soft">{lead}</p>
            <p className="m-0 text-[13px] text-muted">{t.common.privacy}</p>
          </div>
          {children}
        </section>

        <section className="border-y border-line bg-white">
          <div className="mx-auto flex max-w-[1120px] flex-wrap gap-10 px-6 py-14">
            <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3">
              <h2 className={h2}>{t.common.howTitle}</h2>
              <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-[15px] leading-[1.6] text-ink-soft">
                {how.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="m-0 text-[13px] text-muted">{t.common.estimate}</p>
            </div>
            {extra && <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-3">{extra}</div>}
          </div>
        </section>

        <section className="mx-auto flex max-w-[1120px] flex-col gap-5 px-6 py-14">
          <h2 className={h2}>{t.common.related}</h2>
          <Related locale={locale} current={page} />
        </section>

        <section id="lista" className="mx-auto flex max-w-[1120px] flex-col items-center gap-[18px] px-6 pb-[72px] text-center">
          <h2 className="m-0 max-w-[720px] text-[32px] font-extrabold tracking-[-0.02em]">{t.common.cta.title}</h2>
          <p className="m-0 max-w-[560px] text-[17px] leading-[1.6] text-ink-soft">{t.common.cta.text}</p>
          <WaitlistForm
            source="calc"
            locale={locale}
            audience="freelancers"
            landing={LANDING[page]}
            extraQuestions
            t={form}
            buttonLabel={t.common.cta.button}
            successText={t.common.cta.success}
            centered
          />
        </section>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}

export function CalculatorsIndexPage({ locale }: { locale: Locale }) {
  const t = getCalculatorsDictionary(locale);
  return (
    <>
      <SiteHeader locale={locale} page="calculators" />
      <main className="mx-auto flex max-w-[1120px] flex-col gap-8 px-6 pt-12 pb-20">
        <div className="flex max-w-[760px] flex-col gap-3">
          <span className={badge}>{t.common.badge}</span>
          <h1 className="m-0 text-[clamp(32px,8vw,44px)] leading-[1.1] font-extrabold tracking-[-0.025em]">{t.index.title}</h1>
          <p className="m-0 text-[17px] leading-[1.6] text-ink-soft">{t.index.lead}</p>
        </div>
        <Related locale={locale} />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}

export async function TakeHomePage({ locale }: { locale: Locale }) {
  const t = getCalculatorsDictionary(locale);
  return (
    <CalculatorShell locale={locale} page="calcTakeHome" title={t.takeHome.title} lead={t.takeHome.lead} how={t.takeHome.how}>
      <TakeHomeCalculator t={t} locale={locale} rates={await latestRates()} />
    </CalculatorShell>
  );
}

export async function CompanyPage({ locale }: { locale: Locale }) {
  const t = getCalculatorsDictionary(locale);
  const notes = (
    <>
      <h2 className={h2}>{t.company.notesTitle}</h2>
      <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-[15px] leading-[1.6] text-ink-soft">
        {t.company.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </>
  );
  return (
    <CalculatorShell locale={locale} page="calcCompany" title={t.company.title} lead={t.company.lead} how={t.company.how} extra={notes}>
      <CompanyCalculator t={t} locale={locale} rates={await latestRates()} />
    </CalculatorShell>
  );
}

export async function CarneLeaoPage({ locale }: { locale: Locale }) {
  const t = getCalculatorsDictionary(locale);
  // This year's months so far: the tax rules in src/lib/money/tax.ts are the 2026 ones.
  const { year, month } = await brazilMonth();
  const months = await Promise.all(
    Array.from({ length: month }, (_, i) => i + 1).map(async (m) => ({ year, month: m, rate: await carneLeaoRate(year, m) })),
  );
  return (
    <CalculatorShell locale={locale} page="calcCarneLeao" title={t.carneLeao.title} lead={t.carneLeao.lead} how={t.carneLeao.how}>
      <CarneLeaoCalculator t={t} locale={locale} months={months} />
    </CalculatorShell>
  );
}
