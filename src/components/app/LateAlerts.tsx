import Link from "next/link";
import type { AppDictionary } from "@/i18n/app";
import { fill, type Locale } from "@/i18n/config";
import type { LateAlert } from "@/lib/app/alerts";
import type { InvoiceView } from "@/lib/app/invoices";
import { currencySymbol } from "@/lib/app/sources";
import { formatMoney } from "@/lib/calc";
import { formatDay } from "../calculators/shared";

const box = "flex flex-col gap-1 rounded-[12px] bg-amber-tint px-4 py-3 text-[14px] text-amber-ink";

// Payments that look late: a payday passed (plus grace days) after paid work, with nothing logged; and
// invoices past their due date that aren't fully paid.
export function LateAlerts({ t, locale, alerts, invoices = [] }: { t: AppDictionary; locale: Locale; alerts: LateAlert[]; invoices?: InvoiceView[] }) {
  const overdue = invoices.filter((i) => i.state === "overdue");
  if (!alerts.length && !overdue.length) return null;
  return (
    <div className="flex flex-col gap-2">
      {alerts.map((a) => (
        <div key={a.sourceId} role="alert" className={box}>
          <span className="font-semibold">{fill(t.late.line, { source: a.name, payday: formatDay(a.payday, locale) })}</span>
          <span className="flex flex-wrap items-baseline justify-between gap-2">
            <span>{t.late.hint}</span>
            <Link href="/app/pagamentos" className="font-bold text-amber-ink">
              {t.late.register} →
            </Link>
          </span>
        </div>
      ))}
      {overdue.map((i) => (
        <div key={i.id} role="alert" className={box}>
          <span className="font-semibold">
            {fill(t.late.invoice, {
              number: i.number,
              client: i.sourceName,
              due: formatDay(i.due_on, locale),
              amount: formatMoney(currencySymbol(i.currency), i.balance, locale),
            })}
          </span>
          <span className="flex flex-wrap items-baseline justify-between gap-2">
            <span>{t.late.invoiceHint}</span>
            <Link href={`/app/faturas/${i.id}`} className="font-bold text-amber-ink">
              {t.late.seeInvoice} →
            </Link>
          </span>
        </div>
      ))}
    </div>
  );
}
