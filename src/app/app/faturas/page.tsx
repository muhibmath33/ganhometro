import Link from "next/link";
import { Suspense } from "react";
import { formatDay } from "@/components/calculators/shared";
import { InvoiceBadge } from "@/components/app/InvoiceBadge";
import { InvoiceForm } from "@/components/app/InvoiceForm";
import { Card, PageSkeleton } from "@/components/app/ui";
import { getAppDictionary } from "@/i18n/app";
import { fill } from "@/i18n/config";
import { loadInvoices, loadInvoiceSources, OPEN_STATES, owedSummary } from "@/lib/app/invoices";
import { profileLocale, requestNow, requireUser } from "@/lib/app/session";
import { currencySymbol } from "@/lib/app/sources";
import { addDays, dayKey } from "@/lib/app/time";
import { formatMoney } from "@/lib/calc";
import { nextInvoiceNumber } from "@/lib/money/invoices";

async function Invoices() {
  const { supabase, profile, user } = await requireUser();
  const locale = profileLocale(profile);
  const t = getAppDictionary(locale);
  const v = t.invoices;
  const today = dayKey(new Date(requestNow()), profile.timezone);
  const [invoices, sources] = await Promise.all([loadInvoices(supabase, user.id, today), loadInvoiceSources(supabase, user.id)]);
  const owed = owedSummary(invoices);
  const money = (currency: string, n: number) => formatMoney(currencySymbol(currency), n, locale);
  // Open ones first (overdue, then by due date), then the rest, newest first.
  const open = invoices.filter((i) => OPEN_STATES.includes(i.state)).sort((a, b) => a.due_on.localeCompare(b.due_on));
  const rest = invoices.filter((i) => !OPEN_STATES.includes(i.state));
  const first = sources[0];

  const row = (i: (typeof invoices)[number]) => (
    <li key={i.id}>
      <Link href={`/app/faturas/${i.id}`} className="flex flex-col gap-1 rounded-[12px] bg-paper px-4 py-3 text-ink no-underline hover:text-ink">
        <span className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-[15px] font-bold">
            <span className="font-mono">{i.number}</span> · {i.sourceName}
            {i.projectName && <span className="font-semibold text-ink-soft"> · {i.projectName}</span>}
          </span>
          <span className="font-mono text-[15px] font-semibold">{money(i.currency, i.amount)}</span>
        </span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-soft">
          <InvoiceBadge t={t} state={i.state} />
          {fill(v.row, { issued: formatDay(i.issued_on, locale), due: formatDay(i.due_on, locale) })}
        </span>
        {OPEN_STATES.includes(i.state) && (
          <span className="text-[13px] text-ink-soft">
            <span className="font-semibold text-ink">{fill(v.balance, { amount: money(i.currency, i.balance) })}</span>
            {i.paid > 0 && ` · ${fill(v.paidOf, { paid: money(i.currency, i.paid), amount: money(i.currency, i.amount) })}`}
          </span>
        )}
      </Link>
    </li>
  );

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em]">{v.title}</h1>
        <p className="m-0 max-w-[640px] text-[15px] text-ink-soft">{v.lead}</p>
      </div>

      <Card>
        <h2 className="m-0 text-[17px] font-bold">{v.owed}</h2>
        {owed.byCurrency.size ? (
          <div className="flex flex-col gap-1">
            {[...owed.byCurrency].map(([currency, amount]) => (
              <span key={currency} className="text-[15px]">
                <span className="font-mono text-[22px] font-semibold">{money(currency, amount)}</span>{" "}
                <span className="text-ink-soft">{v.owedLine}</span>
              </span>
            ))}
            {owed.overdue > 0 && <span className="text-[14px] font-semibold text-amber-ink">{fill(v.overdueLine, { n: owed.overdue })}</span>}
          </div>
        ) : (
          <p className="m-0 text-[14px] text-muted">{v.none}</p>
        )}
      </Card>

      <Card>
        <details open={!invoices.length}>
          <summary className="cursor-pointer text-[17px] font-bold marker:text-brand">{v.new}</summary>
          <div className="pt-4">
            {first ? (
              <InvoiceForm
                t={t}
                locale={locale}
                sources={sources}
                values={{
                  sourceId: first.id,
                  projectId: "",
                  number: nextInvoiceNumber(
                    invoices.map((i) => i.number),
                    Number(today.slice(0, 4)),
                  ),
                  issuedOn: today,
                  dueOn: first.terms != null ? addDays(today, first.terms) : today,
                  amount: "",
                  currency: first.currency,
                  periodStart: "",
                  periodEnd: "",
                  status: "sent",
                }}
              />
            ) : (
              <Link href="/app/fontes" className="text-[15px] font-semibold">
                {t.timer.addSource}
              </Link>
            )}
          </div>
        </details>
      </Card>

      {!invoices.length && <p className="m-0 text-[15px] text-muted">{v.empty}</p>}
      {open.length > 0 && (
        <Card>
          <h2 className="m-0 text-[17px] font-bold">{v.states.open}</h2>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">{open.map(row)}</ul>
        </Card>
      )}
      {rest.length > 0 && (
        <Card>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">{rest.map(row)}</ul>
        </Card>
      )}
    </>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Invoices />
    </Suspense>
  );
}
