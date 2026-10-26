import Link from "next/link";
import type { AppDictionary } from "@/i18n/app";
import { fill, type Locale } from "@/i18n/config";
import type { TakeHome } from "@/lib/money/received";
import { AmountRow, brl, NetBar } from "../calculators/shared";
import { Card } from "./ui";

// The month's take-home ("Quanto sobra"): what was received, minus commission, fees, INSS and tax.
// compact: one line for Today; otherwise the full breakdown for the dashboard.
export function TakeHomeCard({
  t,
  locale,
  month,
  takeHome,
  count,
  mode,
  compact = false,
}: {
  t: AppDictionary;
  locale: Locale;
  month: string;
  takeHome: TakeHome;
  count: number;
  mode: "pf" | "cnpj";
  compact?: boolean;
}) {
  const th = t.takeHome;
  const title = fill(th.title, { month });
  if (!count) {
    return (
      <Card>
        <h2 className="m-0 text-[17px] font-bold first-letter:uppercase">{title}</h2>
        <p className="m-0 text-[14px] text-muted">{fill(th.noPayments, { month })}</p>
        <Link href="/app/pagamentos" className="text-[15px] font-semibold">
          {th.addPayment}
        </Link>
      </Card>
    );
  }
  const taxes = takeHome.inss + takeHome.tax;
  const costs = takeHome.commission + takeHome.fees + takeHome.accountant;
  const share = takeHome.received > 0 ? Math.round((takeHome.kept / takeHome.received) * 100) : 0;

  if (compact) {
    return (
      <Card className="gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="m-0 text-[17px] font-bold first-letter:uppercase">{title}</h2>
          <span className="font-mono text-[22px] font-semibold">{brl(takeHome.kept, locale)}</span>
        </div>
        <NetBar kept={takeHome.kept} taxes={taxes} costs={costs} legend={th.legend} showLegend={false} />
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-[13px] text-ink-soft">
          <span>{fill(th.short, { kept: brl(takeHome.kept, locale), received: brl(takeHome.received, locale) })}</span>
          <Link href="/app/painel" className="font-semibold">
            {t.nav.dashboard} →
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="m-0 text-[17px] font-bold first-letter:uppercase">{title}</h2>
      <div className="flex flex-col gap-1 rounded-[14px] bg-ink px-5 py-4 text-white">
        <span className="text-[13px] font-semibold text-night-text">{th.left}</span>
        <span className="font-mono text-[30px] leading-tight font-semibold text-mint">{brl(takeHome.kept, locale)}</span>
        <span className="text-[14px] text-night-text">{fill(th.share, { n: share })}</span>
      </div>
      <NetBar kept={takeHome.kept} taxes={taxes} costs={costs} legend={th.legend} />
      <dl className="m-0 flex flex-col">
        <AmountRow label={th.rows.received} amount={takeHome.received} locale={locale} strong />
        {takeHome.commission > 0 && <AmountRow label={th.rows.commission} amount={-takeHome.commission} locale={locale} />}
        <AmountRow label={th.rows.fees} amount={-takeHome.fees} locale={locale} />
        {mode === "cnpj" ? (
          <>
            <AmountRow label={th.rows.das} amount={-takeHome.das} locale={locale} />
            <AmountRow label={th.rows.proLaboreInss} amount={-takeHome.inss} locale={locale} />
            <AmountRow label={th.rows.proLaboreTax} amount={-takeHome.proLaboreTax} locale={locale} />
            <AmountRow label={th.rows.accountant} amount={-takeHome.accountant} locale={locale} />
          </>
        ) : (
          <>
            <AmountRow label={th.rows.inss} amount={-takeHome.inss} locale={locale} />
            <AmountRow label={th.rows.tax} amount={-takeHome.tax} locale={locale} />
          </>
        )}
      </dl>
      {takeHome.feesUnknown > 0 && <p className="m-0 text-[13px] text-amber-ink">{fill(th.feesUnknown, { n: takeHome.feesUnknown })}</p>}
      {takeHome.missingRates > 0 && <p className="m-0 text-[13px] text-amber-ink">{fill(th.missingRates, { n: takeHome.missingRates })}</p>}
      <p className="m-0 text-[12px] leading-[1.5] text-muted">
        {fill(th.note, { mode: th.modes[mode] })}{" "}
        <Link href="/app/ajustes" className="font-semibold">
          {th.change}
        </Link>
      </p>
    </Card>
  );
}
