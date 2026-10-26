import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deletePayment } from "@/app/app/actions";
import { ConfirmDelete } from "@/components/app/ConfirmDelete";
import { PaymentForm } from "@/components/app/PaymentForm";
import { Card, PageSkeleton } from "@/components/app/ui";
import { getAppDictionary } from "@/i18n/app";
import { loadPaymentSources } from "@/lib/app/invoices";
import { profileLocale, requestNow, requireUser } from "@/lib/app/session";
import { dayKey } from "@/lib/app/time";

// Amounts back into the form in the user's number format.
const editable = (n: number | null, locale: string) => (n === null ? "" : locale === "en" ? String(n) : String(n).replace(".", ","));

async function EditPayment({ params }: { params: PageProps<"/app/pagamentos/[id]">["params"] }) {
  const { id } = await params;
  const { supabase, profile, user } = await requireUser();
  const locale = profileLocale(profile);
  const t = getAppDictionary(locale);
  // RLS only returns the row if it belongs to this user.
  const { data: payment } = await supabase.from("payments").select("*").eq("id", id).maybeSingle();
  if (!payment) notFound();
  const today = dayKey(new Date(requestNow()), profile.timezone);
  // Active ones, plus the payment's own source, project and invoice even if archived or settled since.
  const sources = await loadPaymentSources(supabase, user.id, today, {
    sourceId: payment.source_id,
    projectId: payment.project_id,
    invoiceId: payment.invoice_id,
  });

  return (
    <Card className="mx-auto w-full max-w-xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="m-0 text-[22px] font-extrabold">{t.payments.editTitle}</h1>
        <Link href="/app/pagamentos" className="text-[14px] font-semibold">
          {t.common.cancel}
        </Link>
      </div>
      <PaymentForm
        t={t}
        locale={locale}
        sources={sources}
        maxDate={today}
        values={{
          id: payment.id,
          sourceId: payment.source_id,
          projectId: payment.project_id ?? "",
          invoiceId: payment.invoice_id ?? "",
          amount: editable(Number(payment.amount), locale),
          currency: payment.currency,
          receivedOn: payment.received_on,
          method: payment.method ?? "",
          brl: editable(payment.amount_brl_received === null ? null : Number(payment.amount_brl_received), locale),
          periodStart: payment.period_start ?? "",
          periodEnd: payment.period_end ?? "",
        }}
      />
      <hr className="m-0 border-0 border-t border-line" />
      <ConfirmDelete
        action={deletePayment}
        id={payment.id}
        labels={{ button: t.payment.delete, question: t.payment.confirmDelete, confirm: t.payment.confirm, cancel: t.common.cancel }}
      />
    </Card>
  );
}

export default function EditPaymentPage({ params }: PageProps<"/app/pagamentos/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <EditPayment params={params} />
    </Suspense>
  );
}
