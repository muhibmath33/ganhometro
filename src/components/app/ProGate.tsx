import Link from "next/link";
import type { AppDictionary } from "@/i18n/app";

export type ProFeature = keyof AppDictionary["plans"]["gate"]["features"];

// Shown in place of a Pro feature on the Free plan: what it does, and the way to the plans.
export function ProGate({ t, feature, title }: { t: AppDictionary; feature: ProFeature; title?: string }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-brand/30 bg-brand-tint p-5">
      <span className="text-[12px] font-bold tracking-[0.06em] text-brand uppercase">{t.plans.gate.title}</span>
      {title && <h2 className="m-0 text-[17px] font-bold">{title}</h2>}
      <p className="m-0 max-w-[620px] text-[15px] text-ink">{t.plans.gate.features[feature]}</p>
      <Link href="/app/plano" className="self-start rounded-[10px] bg-brand px-4 py-2.5 text-[15px] font-bold text-white no-underline hover:text-white">
        {t.plans.gate.see}
      </Link>
    </section>
  );
}

// A whole page that's Pro: its title, then the card above.
export function ProPage({ t, feature, title }: { t: AppDictionary; feature: ProFeature; title: string }) {
  return (
    <>
      <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em]">{title}</h1>
      <ProGate t={t} feature={feature} />
    </>
  );
}
