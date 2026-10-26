import { fill, type Locale } from "@/i18n/config";
import type { FreelancerExtras } from "@/i18n/freelancers";
import { companyMonth, individualMonth } from "@/lib/money/tax";
import { brl, NetBar, NetLegend, reais } from "./calculators/shared";

// The /freelancers hero example: US$ 3.000 a month as an individual vs. a Simples company.
// Computed with the calculators' tax rules, so the numbers always match them (docs/freelancer-market.md §2.1).
const USD = 3000;
const RATE = 5.5;
const FEES = 0.015;

export function NetExampleCard({ t, locale }: { t: FreelancerExtras["netExample"]; locale: Locale }) {
  const gross = USD * RATE;
  const fees = gross * FEES;
  const pf = individualMonth(gross, { inss: "full" });
  const pj = companyMonth(gross)!;
  const rows = [
    { key: "pf", label: t.pf, kept: pf.net - fees, taxes: pf.inss + pf.tax, costs: fees },
    { key: "pj", label: t.pj, kept: pj.net - fees, taxes: pj.das + pj.inss + pj.irrf, costs: fees + pj.accountant },
  ];
  const money = (n: number) => `R$ ${reais(n, locale)}`;
  const diff = rows[1].kept - rows[0].kept;

  return (
    <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-4 rounded-[18px] border border-line bg-white p-[22px] shadow-[0_12px_32px_rgba(19,32,27,0.08)]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[16px] font-extrabold">{t.title}</span>
        <span className="text-[12px] text-muted">{fill(t.caption, { rate: brl(RATE, locale) })}</span>
      </div>
      {rows.map((r) => (
        <div key={r.key} className="flex flex-col gap-2.5 rounded-[14px] bg-paper p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-[15px] font-bold">{r.label}</span>
            <span className="font-mono text-[15px] font-semibold">{money(r.kept)}</span>
          </div>
          <NetBar kept={r.kept} taxes={r.taxes} costs={r.costs} legend={t.legend} showLegend={false} />
          <span className="text-[13px] text-ink-soft">
            {fill(t.share, { n: Math.round((r.kept / gross) * 100) })} · {fill(t.detail, { taxes: money(r.taxes), costs: money(r.costs) })}
          </span>
        </div>
      ))}
      <NetLegend legend={t.legend} />
      <div className="rounded-[10px] bg-ink px-3 py-2.5 text-[13px] leading-[1.45] font-semibold text-white">
        {fill(t.verdict, { diff: money(diff), year: money(diff * 12) })}
      </div>
    </div>
  );
}
