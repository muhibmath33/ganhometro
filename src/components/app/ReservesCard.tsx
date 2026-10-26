import Link from "next/link";
import type { AppDictionary } from "@/i18n/app";
import { fill, type Locale } from "@/i18n/config";
import type { ReserveHistory, ReservePlan } from "@/lib/money/reserves";
import { AmountRow, brl } from "../calculators/shared";
import { Card } from "./ui";

// This month's reserves: what to move to a tax account, the salary to pay yourself, the set-asides, and
// the running balances. Ganhômetro never holds the money.
export function ReservesCard({
  t,
  locale,
  month,
  plan,
  history,
  salarySet,
  suggestion,
  emergencyTarget,
}: {
  t: AppDictionary;
  locale: Locale;
  month: string;
  plan: ReservePlan;
  history: ReserveHistory;
  salarySet: boolean;
  suggestion: number | null;
  emergencyTarget: number;
}) {
  const r = t.reserves;
  return (
    <Card>
      <div className="flex flex-col gap-0.5">
        <h2 className="m-0 text-[17px] font-bold first-letter:uppercase">{fill(r.title, { month })}</h2>
        <p className="m-0 text-[13px] text-ink-soft">{r.lead}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <h3 className="m-0 text-[14px] font-bold text-ink-soft">{r.move}</h3>
          <dl className="m-0 flex flex-col">
            <AmountRow label={r.rows.tax} amount={plan.tax} locale={locale} />
            <AmountRow label={r.rows.inss} amount={plan.inss} locale={locale} />
            {plan.thirteenth > 0 && <AmountRow label={r.rows.thirteenth} amount={plan.thirteenth} locale={locale} />}
            {plan.vacation > 0 && <AmountRow label={r.rows.vacation} amount={plan.vacation} locale={locale} />}
            {plan.emergency > 0 && <AmountRow label={r.rows.emergency} amount={plan.emergency} locale={locale} />}
          </dl>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="m-0 text-[14px] font-bold text-ink-soft">{r.yours}</h3>
          <dl className="m-0 flex flex-col">
            {salarySet && <AmountRow label={r.rows.salary} amount={plan.salary} locale={locale} strong />}
            <AmountRow label={plan.leftover >= 0 ? r.rows.toBuffer : r.rows.fromBuffer} amount={plan.leftover} locale={locale} />
          </dl>
        </div>
      </div>

      {salarySet ? (
        <div className="flex flex-col gap-1 rounded-[12px] bg-paper px-4 py-3 text-[14px]">
          <span className="font-bold">{r.funds}</span>
          <span className="text-ink-soft">
            {[
              `${r.buffer}: ${brl(history.buffer, locale)}`,
              history.thirteenthFund > 0 ? `${r.thirteenthFund}: ${brl(history.thirteenthFund, locale)}` : null,
              history.vacationFund > 0 ? `${r.vacationFund}: ${brl(history.vacationFund, locale)}` : null,
              emergencyTarget > 0 ? fill(r.emergencyFund, { amount: brl(history.emergencyFund, locale), target: brl(emergencyTarget, locale) }) : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-1 rounded-[12px] bg-brand-tint px-4 py-3 text-[14px] text-brand">
          <span className="font-semibold">{r.noSalary}</span>
          {suggestion !== null && <span>{fill(r.suggest, { amount: brl(suggestion, locale) })}</span>}
          <Link href="/app/ajustes" className="font-bold">
            {r.setSalary} →
          </Link>
        </div>
      )}
      <p className="m-0 text-[12px] leading-[1.5] text-muted">{r.note}</p>
    </Card>
  );
}
