import Link from "next/link";
import { Suspense } from "react";
import { formatDay } from "@/components/calculators/shared";
import { LateAlerts } from "@/components/app/LateAlerts";
import { PaymentForm } from "@/components/app/PaymentForm";
import { Card, PageSkeleton } from "@/components/app/ui";
import { getAppDictionary } from "@/i18n/app";
import { fill } from "@/i18n/config";
import { latePayments } from "@/lib/app/alerts";
import { loadInvoices, loadPaymentSources, owedSummary } from "@/lib/app/invoices";
import { paymentMoney } from "@/lib/app/money";
import { profileLocale, requestNow, requireUser } from "@/lib/app/session";
import { currencySymbol } from "@/lib/app/sources";
import { dayKey, startOfDay } from "@/lib/app/time";
import { formatMoney } from "@/lib/calc";
import { loadRates } from "@/lib/money/rates";
import { checkUnderpayment } from "@/lib/money/received";

const LIMIT = 200;

async function Payments({ searchParams }: { searchParams: PageProps<"/app/pagamentos">["searchParams"] }) {
  const { supabase, profile, user } = await requireUser();
  const locale = profileLocale(profile);
  const t = getAppDictionary(locale);
  const tz = profile.timezone;
  const params = await searchParams;
  const now = requestNow();
  const today = dayKey(new Date(now), tz);

  const [{ data: paymentRows }, { data: sourceRows }, { data: projectRows }, late, active, invoices] = await Promise.all([
    supabase.from("payments").select("*").order("received_on", { ascending: false }).order("created_at", { ascending: false }).limit(LIMIT),
    supabase.from("income_sources").select("id, name, currency, pay_model, rate, commission_pct, archived_at").order("created_at"),
    supabase.from("projects").select("id, source_id, name, pay_model, rate").order("created_at"),
    latePayments(supabase, user.id, tz, today),
    loadPaymentSources(supabase, user.id, today),
    loadInvoices(supabase, user.id, today),
  ]);
  const payments = paymentRows ?? [];
  const sources = sourceRows ?? [];
  const projects = projectRows ?? [];
  const byId = new Map(sources.map((s) => [s.id, s]));
  const invoiceNumber = new Map(invoices.map((i) => [i.id, i.number]));
  const projectName = new Map(projects.map((p) => [p.id, p.name]));
  const owed = owedSummary(invoices);
  // "Registrar pagamento desta fatura": the form starts with that invoice and what's left on it.
  const forInvoice = typeof params.fatura === "string" ? invoices.find((i) => i.id === params.fatura) : undefined;
  const editable = (n: number) => (locale === "en" ? n.toFixed(2) : n.toFixed(2).replace(".", ","));
  const first = (forInvoice && active.find((s) => s.id === forInvoice.source_id)) || active[0];

  // Hours in the displayed payments' periods (for "possível diferença") and the rates to convert them.
  const days = payments.flatMap((p) => [p.period_start ?? p.received_on, p.received_on]).sort();
  const [{ data: entryRows }, book] = await Promise.all([
    days.length
      ? supabase
          .from("time_entries")
          .select("source_id, project_id, kind, units, started_at, ended_at")
          .gte("started_at", startOfDay(days[0], tz).toISOString())
      : Promise.resolve({ data: [] }),
    days.length ? loadRates(supabase, payments.map((p) => p.currency), days[0], days[days.length - 1]) : Promise.resolve({}),
  ]);
  const entries = entryRows ?? [];

  const months: { key: string; rows: typeof payments }[] = [];
  for (const p of payments) {
    const key = p.received_on.slice(0, 7);
    if (months.at(-1)?.key !== key) months.push({ key, rows: [] });
    months[months.length - 1].rows.push(p);
  }
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" });
  const brl = (n: number) => formatMoney("R$", n, locale);
  const pct = (n: number) => new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(n);

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em]">{t.payments.title}</h1>
        <p className="m-0 max-w-[640px] text-[15px] text-ink-soft">{t.payments.lead}</p>
      </div>

      <LateAlerts t={t} locale={locale} alerts={late} invoices={invoices} />

      {invoices.length > 0 && (
        <Card>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="m-0 text-[17px] font-bold">{t.invoices.owed}</h2>
            <Link href="/app/faturas" className="text-[14px] font-semibold">
              {t.invoices.see} →
            </Link>
          </div>
          {owed.byCurrency.size ? (
            <p className="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[14px] text-ink-soft">
              {[...owed.byCurrency].map(([currency, amount]) => (
                <span key={currency} className="font-mono text-[18px] font-semibold text-ink">
                  {formatMoney(currencySymbol(currency), amount, locale)}
                </span>
              ))}
              <span>{t.invoices.owedLine}</span>
              {owed.overdue > 0 && <span className="font-semibold text-amber-ink">· {fill(t.invoices.overdueLine, { n: owed.overdue })}</span>}
            </p>
          ) : (
            <p className="m-0 text-[14px] text-muted">{t.invoices.none}</p>
          )}
        </Card>
      )}

      {typeof params.importados === "string" && (
        <p role="status" className="m-0 rounded-[12px] bg-brand-tint px-4 py-3 text-[14px] font-semibold text-brand">
          {fill(t.payments.importResult, { added: params.importados, existing: String(params.existentes ?? 0) })}
        </p>
      )}

      {active.length ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 text-[17px] font-bold">{t.payment.add}</h2>
            <Link href="/app/pagamentos/importar" className="rounded-[9px] border border-line bg-white px-3 py-2 text-[13px] font-semibold no-underline">
              {t.payments.import}
            </Link>
          </div>
          <PaymentForm
            t={t}
            locale={locale}
            sources={active}
            maxDate={today}
            values={{
              sourceId: first.id,
              projectId: forInvoice?.project_id ?? "",
              invoiceId: forInvoice?.id ?? "",
              back: forInvoice ? "invoice" : undefined,
              amount: forInvoice ? editable(forInvoice.balance) : "",
              currency: forInvoice?.currency ?? first.currency,
              receivedOn: today,
              method: "",
              brl: "",
              periodStart: "",
              periodEnd: "",
            }}
          />
        </Card>
      ) : (
        <Card>
          <p className="m-0 text-[15px] text-ink-soft">{t.timer.noSources}</p>
          <Link href="/app/fontes" className="text-[15px] font-semibold">
            {t.timer.addSource}
          </Link>
        </Card>
      )}

      {!payments.length && <p className="m-0 text-[15px] text-muted">{t.payments.empty}</p>}

      {months.map(({ key, rows }) => {
        const values = rows.map((p) => {
          const source = byId.get(p.source_id);
          const commission = Number(source?.commission_pct ?? 0);
          return { p, source, commission, money: paymentMoney(p, book, commission) };
        });
        const total = values.reduce((sum, v) => sum + (v.money.arrivedBrl ?? v.money.marketBrl ?? 0), 0);
        return (
          <Card key={key}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="m-0 text-[17px] font-bold first-letter:uppercase">{monthLabel.format(new Date(`${key}-15T12:00:00Z`))}</h2>
              <span className="font-mono text-[14px] text-ink-soft">≈ {brl(total)}</span>
            </div>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {values.map(({ p, source, commission, money }) => {
                const amount = Number(p.amount);
                const expectedArrival = money.marketBrl === null ? null : money.marketBrl * (1 - commission / 100);
                const loss = money.arrivedBrl !== null && expectedArrival !== null ? expectedArrival - money.arrivedBrl : null;
                const under = source
                  ? checkUnderpayment(
                      { pay_model: source.pay_model, rate: source.rate === null ? null : Number(source.rate), commission_pct: commission },
                      { ...p, amount },
                      entries.filter((e) => e.source_id === p.source_id),
                      {
                        timeZone: tz,
                        now,
                        projects: projects
                          .filter((x) => x.source_id === p.source_id)
                          .map((x) => ({
                            id: x.id,
                            pay_model: x.pay_model === "hourly" || x.pay_model === "fixed" ? x.pay_model : null,
                            rate: x.rate === null ? null : Number(x.rate),
                          })),
                      },
                    )
                  : null;
                const symbol = currencySymbol(p.currency);
                return (
                  <li key={p.id} className="flex items-start justify-between gap-3 rounded-[12px] bg-paper px-4 py-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-[15px] font-bold">
                        {source?.name}{" "}
                        <span className="font-mono">{formatMoney(symbol, amount, locale)}</span>
                      </span>
                      <span className="text-[13px] text-ink-soft">
                        {[
                          formatDay(p.received_on, locale),
                          p.project_id ? projectName.get(p.project_id) : null,
                          p.invoice_id && invoiceNumber.has(p.invoice_id) ? `${t.invoices.form.number} ${invoiceNumber.get(p.invoice_id)}` : null,
                          p.method ? t.payment.methods[p.method as keyof typeof t.payment.methods] : null,
                          p.currency === "BRL"
                            ? null
                            : money.arrivedBrl !== null
                              ? fill(t.payments.arrived, { brl: brl(money.arrivedBrl) })
                              : money.marketBrl !== null
                                ? fill(t.payments.estimated, { brl: brl(money.marketBrl) })
                                : t.payments.noRate,
                          p.origin === "import" ? t.payments.imported : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      {loss !== null && expectedArrival && Math.abs(loss) >= 0.01 && (
                        <span className="text-[13px] text-ink-soft">
                          {loss > 0
                            ? fill(t.payments.loss, { brl: brl(loss), pct: pct(loss / expectedArrival) })
                            : fill(t.payments.gain, { brl: brl(-loss) })}
                        </span>
                      )}
                      {p.period_start && p.period_end && (
                        <span className="text-[12px] text-muted">
                          {fill(t.payments.period, { from: formatDay(p.period_start, locale), to: formatDay(p.period_end, locale) })}
                        </span>
                      )}
                      {under?.flagged && (
                        <span role="note" className="mt-1 rounded-[10px] bg-amber-tint px-3 py-2 text-[13px] font-semibold text-amber-ink">
                          {fill(t.payments.underpaid, {
                            amount: formatMoney(symbol, under.difference, locale),
                            expected: formatMoney(symbol, under.expected, locale),
                          })}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/app/pagamentos/${p.id}`}
                      className="shrink-0 rounded-[9px] border border-line bg-white px-3 py-2 text-[13px] font-semibold no-underline"
                    >
                      {t.common.edit}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}
    </>
  );
}

export default function PaymentsPage({ searchParams }: PageProps<"/app/pagamentos">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Payments searchParams={searchParams} />
    </Suspense>
  );
}
