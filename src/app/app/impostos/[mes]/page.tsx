import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { setTaxPaid } from "@/app/app/actions";
import { AmountRow, brl, formatDay, formatRate } from "@/components/calculators/shared";
import { TaxMonthForm } from "@/components/app/TaxMonthForm";
import { Card, PageSkeleton } from "@/components/app/ui";
import { getAppDictionary } from "@/i18n/app";
import { fill } from "@/i18n/config";
import { monthBounds } from "@/lib/app/money";
import { profileLocale, requestNow, requireUser } from "@/lib/app/session";
import { currencySymbol } from "@/lib/app/sources";
import { loadTaxYear } from "@/lib/app/taxes";
import { dayKey } from "@/lib/app/time";
import { formatMoney } from "@/lib/calc";
import { carneLeaoRate, rateOnOrBefore, type RateCurrency, toTaxBrl } from "@/lib/money/convert";
import { loadRates } from "@/lib/money/rates";
import { RULES_2026, simplesExportRate } from "@/lib/money/tax";

// Numbers back into a form field in the user's format.
const editable = (n: number | null | undefined, locale: string) => (n === null || n === undefined ? "" : locale === "en" ? String(n) : String(n).replace(".", ","));

async function TaxMonth({ params }: { params: PageProps<"/app/impostos/[mes]">["params"] }) {
  const { mes } = await params;
  const { supabase, profile, user } = await requireUser();
  const locale = profileLocale(profile);
  const t = getAppDictionary(locale);
  const m = t.taxMonth;
  const today = dayKey(new Date(requestNow()), profile.timezone);
  if (!/^\d{4}-\d{2}$/.test(mes) || mes < "2026-01" || mes > today.slice(0, 7)) notFound();
  const year = Number(mes.slice(0, 4));
  const month = Number(mes.slice(5, 7));

  const [first, last] = monthBounds(year, month);
  const [data, { data: paymentRows }, { data: detail }] = await Promise.all([
    loadTaxYear(supabase, profile, user.id, year, today),
    supabase.from("payments").select("id, amount, currency, received_on, income_sources(name)").gte("received_on", first).lte("received_on", last).order("received_on"),
    supabase.from("tax_months").select("*").eq("month", first).maybeSingle(),
  ]);
  const row = data.months.find((r) => r.key === mes);
  if (!row) notFound();
  const payments = paymentRows ?? [];
  const book = await loadRates(supabase, payments.map((p) => p.currency), first, last);
  const rule = carneLeaoRate(book, year, month);
  const cl = row.carneLeao;
  const company = row.company;
  const title = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${mes}-15T12:00:00Z`));
  const pct = (n: number) => new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 }).format(n);

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em] first-letter:uppercase">{title}</h1>
        <Link href={`/app/impostos?ano=${year}`} className="text-[14px] font-semibold">
          {m.back}
        </Link>
      </div>

      <Card>
        <h2 className="m-0 text-[17px] font-bold">{m.payments}</h2>
        {payments.length ? (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {payments.map((p) => {
              const amount = Number(p.amount);
              const brlValue = toTaxBrl(book, amount, p.currency, p.received_on);
              const money = formatMoney(currencySymbol(p.currency), amount, locale);
              const parity = p.currency === "EUR" || p.currency === "GBP" ? rateOnOrBefore(book[p.currency as RateCurrency], p.received_on) : null;
              return (
                <li key={p.id} className="flex flex-col gap-0.5 rounded-[12px] bg-paper px-4 py-3">
                  <span className="text-[14px] font-bold">
                    {formatDay(p.received_on, locale)} · {p.income_sources?.name}
                  </span>
                  <span className="font-mono text-[13px] text-ink-soft">
                    {p.currency === "BRL"
                      ? money
                      : brlValue === null || !rule
                        ? `${money} · ${m.noRate}`
                        : parity
                          ? fill(m.conversionParity, {
                              amount: money,
                              usd: formatMoney("US$", amount * parity.parity, locale),
                              rate: formatRate(rule.buy, locale),
                              brl: brl(brlValue, locale),
                            })
                          : fill(m.conversion, { amount: money, rate: formatRate(rule.buy, locale), brl: brl(brlValue, locale) })}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="m-0 text-[14px] text-muted">{m.noPayments}</p>
        )}
        {rule && payments.some((p) => p.currency !== "BRL") && (
          <p className="m-0 text-[12px] text-muted">{fill(m.rateNote, { date: formatDay(rule.day, locale) })}</p>
        )}
      </Card>

      <Card>
        <h2 className="m-0 text-[17px] font-bold">{m.breakdown}</h2>
        {data.mode === "cnpj" && company ? (
          <dl className="m-0 flex flex-col">
            <AmountRow label={m.rows.revenue} amount={row.gross} locale={locale} strong />
            <AmountRow label={m.rows.rbt12} amount={row.rbt12} locale={locale} />
            <AmountRow label={`${m.rows.das} · ${pct(simplesExportRate(row.rbt12)?.exportRate ?? 0)}`} amount={-company.das} locale={locale} />
            <AmountRow label={m.rows.proLabore} amount={company.proLabore} locale={locale} />
            <AmountRow label={m.rows.proLaboreInss} amount={-company.inss} locale={locale} />
            <AmountRow label={m.rows.proLaboreTax} amount={-company.irrf} locale={locale} />
            <AmountRow label={m.rows.total} amount={row.amountDue} locale={locale} strong />
            <AmountRow label={m.rows.accountant} amount={-company.accountant} locale={locale} />
          </dl>
        ) : (
          <dl className="m-0 flex flex-col">
            <AmountRow label={m.rows.gross} amount={row.gross} locale={locale} strong />
            <AmountRow label={row.inssEstimated ? m.rows.inssEstimated : m.rows.inss} amount={-row.inss} locale={locale} />
            {row.dependents > 0 && (
              <AmountRow label={fill(m.rows.dependents, { n: row.dependents })} amount={-row.dependents * RULES_2026.perDependent} locale={locale} />
            )}
            {row.alimony > 0 && <AmountRow label={m.rows.alimony} amount={-row.alimony} locale={locale} />}
            {row.other > 0 && <AmountRow label={m.rows.other} amount={-row.other} locale={locale} />}
            <AmountRow
              label={`${m.rows.deduction} (${cl.legal > RULES_2026.simplified ? m.rows.legal : m.rows.simplified})`}
              amount={-cl.deduction}
              locale={locale}
            />
            <AmountRow label={m.rows.base} amount={cl.base} locale={locale} />
            <AmountRow label={m.rows.tax} amount={cl.tax} locale={locale} />
            <AmountRow label={m.rows.reduction} amount={-cl.reduction} locale={locale} />
            <AmountRow label={m.rows.monthTax} amount={cl.monthTax} locale={locale} />
            {cl.carry > 0 && <AmountRow label={m.rows.carry} amount={cl.carry} locale={locale} />}
            <AmountRow label={m.rows.darf} amount={cl.darf} locale={locale} strong />
          </dl>
        )}
        {row.amountDue > 0 && <p className="m-0 text-[14px] font-semibold">{fill(m.dueOn, { date: formatDay(row.due, locale) })}</p>}
        {data.mode === "pf" && row.inss > 0 && (
          <p className="m-0 text-[13px] text-ink-soft">{fill(m.inssDue, { date: formatDay(row.inssDue, locale) })}</p>
        )}
        {row.amountDue > 0 && (
          <form action={setTaxPaid} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="month" value={mes} />
            <input type="hidden" name="paid" value={row.paidOn ? "0" : "1"} />
            {row.paidOn && <span className="text-[14px] font-semibold text-brand">{fill(m.paidOn, { date: formatDay(row.paidOn, locale) })}</span>}
            <button
              type="submit"
              className={`min-h-11 cursor-pointer rounded-[10px] px-4 font-sans text-[14px] font-semibold ${
                row.paidOn ? "border border-line bg-white text-ink-soft" : "border-0 bg-brand text-white"
              }`}
            >
              {row.paidOn ? m.markUnpaid : m.markPaid}
            </button>
          </form>
        )}
        <p className="m-0 text-[12px] text-muted">{t.taxes.howToPay[data.mode]}</p>
      </Card>

      {data.mode === "pf" && (
        <Card>
          <div className="flex flex-col gap-0.5">
            <h2 className="m-0 text-[17px] font-bold">{m.deductions}</h2>
            <p className="m-0 text-[14px] text-ink-soft">{m.deductionsLead}</p>
          </div>
          <TaxMonthForm
            t={t}
            values={{
              month: mes,
              inssPaid: editable(detail?.inss_paid === null || detail?.inss_paid === undefined ? null : Number(detail.inss_paid), locale),
              dependents: detail?.dependents === null || detail?.dependents === undefined ? "" : String(detail.dependents),
              alimony: Number(detail?.alimony ?? 0) ? editable(Number(detail?.alimony), locale) : "",
              other: Number(detail?.other_deductions ?? 0) ? editable(Number(detail?.other_deductions), locale) : "",
            }}
          />
        </Card>
      )}
    </>
  );
}

export default function TaxMonthPage({ params }: PageProps<"/app/impostos/[mes]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TaxMonth params={params} />
    </Suspense>
  );
}
