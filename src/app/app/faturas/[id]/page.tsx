import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deleteInvoice } from "@/app/app/actions";
import { formatDay } from "@/components/calculators/shared";
import { ConfirmDelete } from "@/components/app/ConfirmDelete";
import { CopyMessage } from "@/components/app/CopyMessage";
import { InvoiceBadge } from "@/components/app/InvoiceBadge";
import { InvoiceForm } from "@/components/app/InvoiceForm";
import { Card, PageSkeleton } from "@/components/app/ui";
import { getAppDictionary } from "@/i18n/app";
import { fill } from "@/i18n/config";
import { loadInvoices, loadInvoiceSources, OPEN_STATES } from "@/lib/app/invoices";
import { profileLocale, requestNow, requireUser } from "@/lib/app/session";
import { currencySymbol } from "@/lib/app/sources";
import { dayKey } from "@/lib/app/time";
import { formatMoney } from "@/lib/calc";
import { reminderMessages } from "@/lib/documents/messages";

async function InvoiceDetail({ params }: { params: PageProps<"/app/faturas/[id]">["params"] }) {
  const { id } = await params;
  const { supabase, profile, user } = await requireUser();
  const locale = profileLocale(profile);
  const t = getAppDictionary(locale);
  const v = t.invoices;
  const today = dayKey(new Date(requestNow()), profile.timezone);
  const invoice = (await loadInvoices(supabase, user.id, today)).find((i) => i.id === id);
  if (!invoice) notFound();
  const [sources, { data: paymentRows }] = await Promise.all([
    loadInvoiceSources(supabase, user.id, { sourceId: invoice.source_id, projectId: invoice.project_id }),
    supabase.from("payments").select("id, amount, currency, received_on").eq("invoice_id", id).order("received_on"),
  ]);
  const money = (n: number) => formatMoney(currencySymbol(invoice.currency), n, locale);
  const d = t.documents;
  const hasPeriod = Boolean(invoice.period_start && invoice.period_end);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <h1 className="m-0 text-[22px] font-extrabold">{fill(v.editTitle, { number: invoice.number })}</h1>
          <Link href="/app/faturas" className="text-[14px] font-semibold">
            {t.common.cancel}
          </Link>
        </div>
        <p className="m-0 flex flex-wrap items-center gap-2 text-[14px] text-ink-soft">
          <InvoiceBadge t={t} state={invoice.state} />
          {fill(v.paidOf, { paid: money(invoice.paid), amount: money(invoice.amount) })}
          {OPEN_STATES.includes(invoice.state) && (
            <span className="font-semibold text-ink">· {fill(v.balance, { amount: money(invoice.balance) })}</span>
          )}
        </p>
        <InvoiceForm
          t={t}
          locale={locale}
          sources={sources}
          values={{
            id: invoice.id,
            sourceId: invoice.source_id,
            projectId: invoice.project_id ?? "",
            number: invoice.number,
            issuedOn: invoice.issued_on,
            dueOn: invoice.due_on,
            amount: locale === "en" ? invoice.amount.toFixed(2) : invoice.amount.toFixed(2).replace(".", ","),
            currency: invoice.currency,
            periodStart: invoice.period_start ?? "",
            periodEnd: invoice.period_end ?? "",
            status: invoice.status,
          }}
        />
      </Card>

      <Card>
        <h2 className="m-0 text-[17px] font-bold">{v.payments}</h2>
        {paymentRows?.length ? (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {paymentRows.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 rounded-[12px] bg-paper px-4 py-3">
                <span className="text-[15px]">
                  <span className="font-mono font-semibold">{formatMoney(currencySymbol(p.currency), Number(p.amount), locale)}</span>{" "}
                  <span className="text-ink-soft">· {formatDay(p.received_on, locale)}</span>
                </span>
                <Link href={`/app/pagamentos/${p.id}`} className="rounded-[9px] border border-line bg-white px-3 py-2 text-[13px] font-semibold no-underline">
                  {t.common.edit}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-[14px] text-muted">{v.noPayments}</p>
        )}
        {OPEN_STATES.includes(invoice.state) && (
          <Link href={`/app/pagamentos?fatura=${invoice.id}`} className="text-[15px] font-semibold">
            {v.logPayment} →
          </Link>
        )}
      </Card>

      <Card>
        <h2 className="m-0 text-[17px] font-bold">{v.pdfTitle}</h2>
        <form method="get" action={`/app/arquivos/fatura/${invoice.id}`} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-[14px] font-bold text-ink">
            {d.language}
            <select name="lang" defaultValue="en" className="min-h-12 w-full rounded-[10px] border border-field bg-white px-3.5 font-sans text-[16px] font-medium text-ink">
              <option value="en">{d.langs.en}</option>
              <option value="pt">{d.langs.pt}</option>
            </select>
          </label>
          {hasPeriod && (
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] font-semibold text-ink">
              <input type="checkbox" name="horas" value="1" defaultChecked className="size-5 shrink-0 accent-brand" />
              {v.withTimesheet}
            </label>
          )}
          <button type="submit" className="min-h-12 cursor-pointer self-start rounded-[10px] border-0 bg-brand px-5 font-sans text-[15px] font-bold text-white">
            {v.downloadPdf}
          </button>
        </form>
        {!profile.doc_name && (
          <p className="m-0 text-[13px] text-amber-ink">
            {d.noName}{" "}
            <Link href="/app/ajustes#documentos" className="font-bold text-amber-ink">
              {d.fillDetails}
            </Link>
          </p>
        )}
      </Card>

      {OPEN_STATES.includes(invoice.state) && (
        <Card>
          <div className="flex flex-col gap-1">
            <h2 className="m-0 text-[17px] font-bold">{v.reminderTitle}</h2>
            <p className="m-0 text-[14px] text-ink-soft">{v.reminderLead}</p>
          </div>
          <CopyMessage
            key={`${invoice.id}-${invoice.balance}`}
            messages={reminderMessages({
              number: invoice.number,
              client: invoice.sourceName,
              currency: invoice.currency,
              amount: invoice.amount,
              paid: invoice.paid,
              balance: invoice.balance,
              issued: invoice.issued_on,
              due: invoice.due_on,
              overdue: invoice.state === "overdue",
              name: profile.doc_name,
            })}
            initial="en"
            labels={{ langs: d.langs, copy: d.copy, copied: d.copied, language: d.language }}
            rows={12}
          />
        </Card>
      )}

      <ConfirmDelete
        action={deleteInvoice}
        id={invoice.id}
        labels={{ button: v.delete, question: v.confirmDelete, confirm: v.confirm, cancel: t.common.cancel }}
      />
    </div>
  );
}

export default function InvoicePage({ params }: PageProps<"/app/faturas/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <InvoiceDetail params={params} />
    </Suspense>
  );
}
