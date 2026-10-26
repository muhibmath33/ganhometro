import Link from "next/link";
import { Suspense } from "react";
import { brl, formatDay } from "@/components/calculators/shared";
import { TaxReminders } from "@/components/app/TaxReminders";
import { Card, PageSkeleton } from "@/components/app/ui";
import { getAppDictionary } from "@/i18n/app";
import { fill, routes } from "@/i18n/config";
import { profileLocale, requestNow, requireUser } from "@/lib/app/session";
import { dueReminders, loadTaxYear } from "@/lib/app/taxes";
import { dayKey } from "@/lib/app/time";
import type { DueStatus } from "@/lib/money/tax";

const STATUS_CLASS: Record<DueStatus, string> = {
  paid: "bg-brand-tint text-brand",
  overdue: "bg-amber text-white",
  soon: "bg-amber-tint text-amber-ink",
  upcoming: "bg-paper text-ink-soft",
  none: "bg-paper text-muted",
};

async function Taxes({ searchParams }: { searchParams: PageProps<"/app/impostos">["searchParams"] }) {
  const { supabase, profile } = await requireUser();
  const locale = profileLocale(profile);
  const t = getAppDictionary(locale);
  const tx = t.taxes;
  const today = dayKey(new Date(requestNow()), profile.timezone);
  const thisYear = Number(today.slice(0, 4));
  const params = await searchParams;
  const asked = Number(params.ano);
  const year = Number.isInteger(asked) && asked >= 2026 && asked <= thisYear ? asked : thisYear;
  const data = await loadTaxYear(supabase, profile, year, today);
  const mode = data.mode;
  const monthName = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" });
  // Months with income, something to pay or a carried balance; the current month always.
  const months = [...data.months]
    .reverse()
    .filter((m) => m.gross > 0 || m.amountDue > 0 || m.carneLeao.carry > 0 || m.key === today.slice(0, 7));
  const withIncome = months.filter((m) => m.gross > 0);

  const totalGross = data.months.reduce((sum, m) => sum + m.gross, 0);
  const totalTax = data.months.reduce((sum, m) => sum + (mode === "cnpj" ? m.amountDue : m.carneLeao.monthTax), 0);
  const totalPaid = data.months.reduce((sum, m) => sum + (m.paidOn ? m.amountDue : 0), 0);
  const c = data.comparison;
  const verdict =
    mode === "pf"
      ? fill(c.savings > 0 ? tx.monitor.savePj : tx.monitor.savePf, { amount: brl(Math.abs(c.savings), locale) })
      : fill(c.savings > 0 ? tx.monitor.keepCnpj : tx.monitor.considerPf, { amount: brl(Math.abs(c.savings), locale) });

  return (
    <>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em]">{fill(tx.title, { year })}</h1>
          <nav aria-label={fill(tx.title, { year: "" }).trim()} className="flex gap-3 text-[14px] font-semibold">
            {year > 2026 && <Link href={`/app/impostos?ano=${year - 1}`}>← {year - 1}</Link>}
            {year < thisYear && <Link href={`/app/impostos?ano=${year + 1}`}>{year + 1} →</Link>}
          </nav>
        </div>
        <p className="m-0 max-w-[640px] text-[15px] text-ink-soft">{tx.lead[mode]}</p>
      </div>

      <TaxReminders t={t} locale={locale} mode={mode} reminders={dueReminders(data, today)} current={year === thisYear ? data.months.at(-1) : undefined} />

      {withIncome.length === 0 ? (
        <Card>
          <p className="m-0 text-[15px] text-ink-soft">{fill(tx.empty, { year })}</p>
          <Link href="/app/pagamentos" className="text-[15px] font-semibold">
            {tx.addPayment}
          </Link>
        </Card>
      ) : (
        <Card>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {months.map((m) => (
              <li key={m.key} className="flex items-center justify-between gap-3 rounded-[12px] bg-paper px-4 py-3">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-bold first-letter:uppercase">{monthName.format(new Date(`${m.key}-15T12:00:00Z`))}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold tracking-[0.04em] uppercase ${STATUS_CLASS[m.status]}`}>
                      {tx.status[m.status]}
                    </span>
                  </span>
                  <span className="text-[13px] text-ink-soft">
                    {mode === "cnpj"
                      ? fill(tx.cnpjRow, {
                          gross: brl(m.gross, locale),
                          das: brl(m.company?.das ?? 0, locale),
                          payroll: brl((m.company?.inss ?? 0) + (m.company?.irrf ?? 0), locale),
                        })
                      : fill(tx.pfRow, { gross: brl(m.gross, locale), tax: brl(m.carneLeao.monthTax, locale) })}
                  </span>
                  {m.amountDue > 0 ? (
                    <span className="text-[13px] font-semibold text-ink">{fill(tx.pay, { amount: brl(m.amountDue, locale), date: formatDay(m.due, locale) })}</span>
                  ) : (
                    mode === "pf" &&
                    m.carneLeao.monthTax + m.carneLeao.carry > 0 && <span className="text-[13px] text-muted">{tx.carry}</span>
                  )}
                </div>
                <Link
                  href={`/app/impostos/${m.key}`}
                  className="shrink-0 rounded-[9px] border border-line bg-white px-3 py-2 text-[13px] font-semibold no-underline"
                >
                  {tx.details}
                </Link>
              </li>
            ))}
          </ul>
          <p className="m-0 text-[14px] text-ink-soft">
            {fill(tx.total, { gross: brl(totalGross, locale), tax: brl(totalTax, locale), paid: brl(totalPaid, locale) })}
          </p>
          {data.missingRates > 0 && <p className="m-0 text-[13px] text-amber-ink">{fill(tx.missingRates, { n: data.missingRates })}</p>}
        </Card>
      )}

      {data.monthsOfHistory > 0 && (
        <Card>
          <h2 className="m-0 text-[17px] font-bold">{tx.monitor.title}</h2>
          <p className="m-0 text-[14px] text-ink-soft">{fill(tx.monitor.basis, { months: data.monthsOfHistory })}</p>
          <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-[14px] text-ink-soft">
            <li>{fill(tx.monitor.pfCost, { amount: brl(c.individual, locale) })}</li>
            <li>{fill(tx.monitor.pjCost, { amount: brl(c.company, locale) })}</li>
          </ul>
          <p className="m-0 rounded-[12px] bg-ink px-4 py-3 text-[15px] leading-[1.5] font-semibold text-white">{verdict}</p>
          {data.breakEven && <p className="m-0 text-[14px] text-ink-soft">{fill(tx.monitor.breakEven, { amount: brl(data.breakEven, locale) })}</p>}
          <p className="m-0 text-[12px] text-muted">
            {tx.monitor.note}{" "}
            <Link href={routes.calcCompany[locale]} className="font-semibold">
              {tx.monitor.calculator}
            </Link>
          </p>
        </Card>
      )}

      <p className="m-0 max-w-[720px] text-[13px] leading-[1.55] text-muted">{tx.howToPay[mode]}</p>
    </>
  );
}

export default function TaxesPage({ searchParams }: PageProps<"/app/impostos">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Taxes searchParams={searchParams} />
    </Suspense>
  );
}
