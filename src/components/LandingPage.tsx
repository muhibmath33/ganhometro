import Link from "next/link";
import { type Audience, fill, getDictionary, type Locale, routes } from "@/i18n";
import { getCalculatorsDictionary } from "@/i18n/calculators";
import { getFreelancerExtras } from "@/i18n/freelancers";
import { calculate, formatMoney } from "@/lib/calc";
import { latestRates } from "@/lib/money/ptax";
import { Calculator } from "./Calculator";
import { TakeHomeCalculator } from "./calculators/TakeHomeCalculator";
import { Faq } from "./Faq";
import { FeatureVotes } from "./FeatureVotes";
import { CardIcon, CheckIcon, ClockIcon, GuideIcon, ReworkIcon } from "./icons";
import { NetExampleCard } from "./NetExampleCard";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { WaitlistForm } from "./WaitlistForm";

const problemIcons = [GuideIcon, ClockIcon, ReworkIcon, CardIcon];

const h2 = "m-0 text-[34px] font-extrabold tracking-[-0.02em]";
const lead = "m-0 text-[17px] leading-[1.6] text-ink-soft";
const badge = "self-start rounded-full bg-brand-tint px-3 py-1.5 text-[13px] font-bold text-brand";
// Full literals so Tailwind can detect them; min(…,100%) avoids overflow on very narrow phones.
const autoGrid = {
  220: "grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))]",
  240: "grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))]",
  280: "grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))]",
  300: "grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))]",
};

// One layout for every audience; the text changes (src/i18n/freelancers.ts), and /freelancers swaps in
// the take-home example, the take-home calculator and the feature vote.
export async function LandingPage({ locale, audience = "ai" }: { locale: Locale; audience?: Audience }) {
  const t = getDictionary(locale, audience);
  const freelancers = audience === "freelancers";
  const extras = getFreelancerExtras(locale);
  const ex = t.example;
  const rate = t.calculator.defaultRate;

  // Hero example card. Numbers come from the same calculator logic, so they always agree with it.
  const examples = [
    { name: ex.platformA, listed: 25, received: 200, paid: 8, unpaid: 6 },
    { name: ex.platformB, listed: 20, received: 200, paid: 10, unpaid: 1 },
  ].map((p) => {
    const { realBrl } = calculate(
      { listed: String(p.listed), received: String(p.received), paid: String(p.paid), unpaid: String(p.unpaid), rate },
      t.calculator.messages,
      locale,
    );
    return {
      ...p,
      realBrl,
      paidPct: Math.round((p.paid / (p.paid + p.unpaid)) * 100),
      advertises: fill(ex.advertises, { rate: formatMoney("US$", p.listed, locale) + "/h" }),
      detail: fill(ex.detail, {
        paid: p.paid,
        unpaid: p.unpaid,
        unpaidWord: p.unpaid === 1 ? ex.unpaidOne : ex.unpaidMany,
        received: p.received,
      }),
    };
  });

  return (
    <>
      <SiteHeader locale={locale} page={audience === "freelancers" ? "freelancers" : "home"} />

      <main>
        {/* Hero */}
        <section
          id="topo"
          className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-12 px-6 pt-[72px] pb-16"
        >
          <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-[22px]">
            <span className={badge}>{t.hero.badge}</span>
            <h1 className="m-0 text-[clamp(38px,12.5vw,50px)] leading-[1.06] font-extrabold tracking-[-0.03em]">
              {t.hero.title}
            </h1>
            <p className="m-0 text-[19px] leading-[1.55] text-ink-soft">{t.hero.lead}</p>
            <WaitlistForm
              source="hero"
              locale={locale}
              audience={audience}
              t={t.form}
              buttonLabel={t.hero.button}
              successText={t.hero.success}
              extraQuestions={freelancers}
            />
            <span className="text-[13px] text-muted">{t.hero.note}</span>
            <span className="text-[14px] text-ink-soft">{t.hero.freelancers}</span>
          </div>

          {freelancers ? (
            <NetExampleCard t={extras.netExample} locale={locale} />
          ) : (
            <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-4 rounded-[18px] border border-line bg-white p-[22px] shadow-[0_12px_32px_rgba(19,32,27,0.08)]">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[16px] font-extrabold">{ex.title}</span>
                <span className="text-[12px] text-muted">{fill(ex.caption, { rate })}</span>
              </div>
              {examples.map((p) => (
                <div key={p.name} className="flex flex-col gap-2.5 rounded-[14px] bg-paper p-4">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="text-[15px] font-bold">{p.name}</span>
                    <span className="text-[13px] text-muted">{p.advertises}</span>
                  </div>
                  <div className="flex h-2.5 overflow-hidden rounded-full bg-line">
                    <div className="bg-brand" style={{ width: `${p.paidPct}%` }} />
                    <div className="bg-unpaid" style={{ width: `${100 - p.paidPct}%` }} />
                  </div>
                  <div className="flex flex-wrap justify-between gap-2 text-[13px] text-ink-soft">
                    <span>{p.detail}</span>
                    <span className="font-mono font-semibold text-ink">{p.realBrl}</span>
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap gap-3.5 text-[13px] text-ink-soft">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-[3px] bg-brand" />
                  {ex.legendPaid}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-[3px] bg-unpaid" />
                  {ex.legendUnpaid}
                </span>
              </div>
              <div className="rounded-[10px] bg-ink px-3 py-2.5 text-[13px] leading-[1.45] font-semibold text-white">
                {ex.verdict}
              </div>
            </div>
          )}
        </section>

        {/* Problem */}
        <section className="border-y border-line bg-white">
          <div className="mx-auto flex max-w-[1120px] flex-col gap-7 px-6 py-16">
            <div className="flex max-w-[700px] flex-col gap-2.5">
              <h2 className={h2}>{t.problem.title}</h2>
              <p className={lead}>{t.problem.lead}</p>
            </div>
            <div className={autoGrid[220]}>
              {t.problem.items.map((item, i) => {
                const Icon = problemIcons[i];
                return (
                  <div key={item.title} className="flex flex-col gap-2.5 rounded-[14px] border border-line p-[22px]">
                    <Icon size={26} color="#B45309" />
                    <h3 className="m-0 text-[18px] font-bold">{item.title}</h3>
                    <p className="m-0 text-[15px] leading-[1.55] text-ink-soft">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Calculator */}
        <section id="calculadora" className="mx-auto flex max-w-[1120px] flex-col gap-6 px-6 py-16">
          <div className="flex max-w-[700px] flex-col gap-2.5">
            <span className={badge}>{t.calculator.badge}</span>
            <h2 className={h2}>{t.calculator.title}</h2>
            <p className={lead}>{t.calculator.lead}</p>
          </div>
          {freelancers ? (
            <>
              <TakeHomeCalculator t={getCalculatorsDictionary(locale)} locale={locale} rates={await latestRates()} />
              <Link href={routes.calculators[locale]} className="self-start text-[15px] font-semibold">
                {extras.calculatorsLink} →
              </Link>
            </>
          ) : (
            <Calculator t={t.calculator} locale={locale} />
          )}
        </section>

        {/* How it works */}
        <section id="como" className="border-y border-line bg-white">
          <div className="mx-auto flex max-w-[1120px] flex-col gap-7 px-6 py-16">
            <h2 className={h2}>{t.how.title}</h2>
            <div className={autoGrid[240]}>
              {t.how.steps.map((s, i) => (
                <div key={s.title} className="flex flex-col gap-2.5 rounded-[14px] border border-line p-[22px]">
                  <span className="flex size-9 items-center justify-center rounded-full bg-brand font-extrabold text-white">
                    {i + 1}
                  </span>
                  <h3 className="m-0 text-[18px] font-bold">{s.title}</h3>
                  <p className="m-0 text-[15px] leading-[1.55] text-ink-soft">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="recursos" className="mx-auto flex max-w-[1120px] flex-col gap-7 px-6 py-16">
          <h2 className={h2}>{t.features.title}</h2>
          <div className={autoGrid[300]}>
            {t.features.items.map((f) => (
              <div key={f.title} className="flex items-start gap-3.5 rounded-[14px] border border-line bg-white p-5">
                <span className="flex size-10 flex-none items-center justify-center rounded-[10px] bg-brand-tint">
                  <CheckIcon color="#0B6B4F" strokeWidth={2.2} />
                </span>
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="m-0 text-[17px] font-bold">{f.title}</h3>
                    {f.soon && (
                      <span className="rounded-full bg-amber-tint px-2 py-0.5 text-[11px] font-bold tracking-[0.04em] text-amber-ink uppercase">
                        {t.features.soon}
                      </span>
                    )}
                  </div>
                  <p className="m-0 text-[15px] leading-[1.55] text-ink-soft">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {freelancers && (
          <section id="votar" className="mx-auto flex max-w-[1120px] flex-col gap-6 px-6 pb-16">
            <div className="flex max-w-[700px] flex-col gap-2.5">
              <span className="self-start rounded-full bg-amber-tint px-3 py-1.5 text-[13px] font-bold text-amber-ink">
                {extras.votes.badge}
              </span>
              <h2 className={h2}>{extras.votes.title}</h2>
              <p className={lead}>{extras.votes.lead}</p>
            </div>
            <FeatureVotes t={extras.votes} locale={locale} />
          </section>
        )}

        {/* Carnê-leão bonus */}
        <section className="mx-auto max-w-[1120px] px-6 pb-16">
          <div className="flex flex-wrap items-center gap-7 rounded-[20px] border border-line bg-white p-8">
            <div className="flex flex-[1_1_360px] flex-col gap-2.5">
              <span className="self-start rounded-full bg-amber-tint px-3 py-1.5 text-[13px] font-bold text-amber-ink">
                {t.tax.badge}
              </span>
              <h2 className="m-0 text-[28px] font-extrabold tracking-[-0.02em]">{t.tax.title}</h2>
              <p className="m-0 text-[16px] leading-[1.6] text-ink-soft">{t.tax.text}</p>
              <p className="m-0 text-[13px] leading-[1.5] text-muted">{t.tax.note}</p>
            </div>
            <ul className="m-0 flex flex-[1_1_300px] list-none flex-col gap-3 p-0">
              {t.tax.points.map((point) => (
                <li key={point} className="flex gap-2.5 text-[15px] leading-[1.5]">
                  <CheckIcon color="#0B6B4F" strokeWidth={2.4} className="mt-0.5 flex-none" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Privacy */}
        <section id="privacidade" className="mx-auto max-w-[1120px] px-6 pb-16">
          <div className="flex flex-wrap items-start gap-8 rounded-[20px] bg-ink p-10 text-white">
            <div className="flex flex-[1_1_320px] flex-col gap-3">
              <h2 className="m-0 text-[32px] font-extrabold tracking-[-0.02em]">{t.privacy.title}</h2>
              <p className="m-0 text-[16px] leading-[1.6] text-night-text">{t.privacy.text}</p>
            </div>
            <ul className="m-0 flex flex-[1_1_360px] list-none flex-col gap-3.5 p-0">
              {t.privacy.points.map((point) => (
                <li key={point} className="flex gap-3 text-[16px] leading-[1.5]">
                  <CheckIcon color="#7FD9B4" strokeWidth={2.4} className="mt-0.5 flex-none" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Plans */}
        <section className="mx-auto flex max-w-[1120px] flex-col gap-7 px-6 pb-16">
          <h2 className={h2}>{t.plans.title}</h2>
          <div className={autoGrid[280]}>
            <div className="flex flex-col gap-3.5 rounded-2xl border border-line bg-white p-[26px]">
              <span className="text-[16px] font-extrabold">{t.plans.free.name}</span>
              <span className="font-mono text-[34px] font-semibold">{t.plans.free.price}</span>
              <ul className="m-0 flex list-disc flex-col gap-2 pl-[18px] text-[15px] leading-[1.5] text-ink-soft">
                {t.plans.free.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3.5 rounded-2xl border-2 border-brand bg-white p-[26px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[16px] font-extrabold">{t.plans.pro.name}</span>
                <span className="rounded-full bg-brand-tint px-2.5 py-1 text-[12px] font-bold text-brand">
                  {t.plans.pro.badge}
                </span>
              </div>
              <span className="font-mono text-[34px] font-semibold">
                {t.plans.pro.price}
                <span className="font-sans text-[15px] font-medium text-muted">{t.plans.pro.perMonth}</span>
              </span>
              <ul className="m-0 flex list-disc flex-col gap-2 pl-[18px] text-[15px] leading-[1.5] text-ink-soft">
                {t.plans.pro.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="duvidas" className="border-y border-line bg-white">
          <div className="mx-auto flex max-w-[820px] flex-col gap-5 px-6 py-16">
            <h2 className={h2}>{t.faq.title}</h2>
            <Faq items={t.faq.items} />
          </div>
        </section>

        {/* Final CTA */}
        <section
          id="lista"
          className="mx-auto flex max-w-[1120px] flex-col items-center gap-[18px] px-6 py-[72px] text-center"
        >
          <h2 className="m-0 max-w-[720px] text-[38px] font-extrabold tracking-[-0.02em]">{t.final.title}</h2>
          <p className="m-0 max-w-[560px] text-[17px] leading-[1.6] text-ink-soft">{t.final.text}</p>
          <WaitlistForm
            source="final"
            locale={locale}
            audience={audience}
            t={t.form}
            buttonLabel={t.final.button}
            successText={t.final.success}
            extraQuestions={freelancers}
            centered
          />
        </section>
      </main>

      <SiteFooter locale={locale} />
    </>
  );
}
