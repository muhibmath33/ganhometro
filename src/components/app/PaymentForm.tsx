"use client";

import { useActionState, useState } from "react";
import { type PaymentFormState, savePayment } from "@/app/app/actions";
import type { AppDictionary } from "@/i18n/app";
import { fill, type Locale } from "@/i18n/config";
import { METHODS } from "@/lib/app/payments";
import { CURRENCIES, currencySymbol } from "@/lib/app/sources";
import { formatMoney } from "@/lib/calc";
import { fieldInput, fieldLabel } from "./SourceFields";
import { FormMessage, SubmitButton } from "./ui";

export type PaymentSource = {
  id: string;
  name: string;
  currency: string;
  projects: { id: string; name: string }[];
  // Invoices still open (and the payment's own), with what's left to pay.
  invoices: { id: string; number: string; currency: string; balance: number; projectId: string | null }[];
};
export type PaymentValues = {
  id?: string;
  sourceId: string;
  projectId: string;
  invoiceId: string;
  back?: "invoice"; // logged from an invoice's page: go back there
  amount: string;
  currency: string;
  receivedOn: string;
  method: string;
  brl: string;
  periodStart: string;
  periodEnd: string;
};

const hint = "text-[12px] font-normal text-muted";
const grid = "grid grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] gap-4";

// Log a payment (no id) or fix one (with id).
export function PaymentForm({
  t,
  locale,
  sources,
  values,
  maxDate,
}: {
  t: AppDictionary;
  locale: Locale;
  sources: PaymentSource[];
  values: PaymentValues;
  maxDate: string;
}) {
  const p = t.payment;
  const [state, action, pending] = useActionState<PaymentFormState, FormData>(savePayment, null);
  const [sourceId, setSourceId] = useState(values.sourceId);
  const [currency, setCurrency] = useState(values.currency);
  const [currencyTouched, setCurrencyTouched] = useState(Boolean(values.id || values.invoiceId));
  const [amount, setAmount] = useState(values.amount);
  const [invoiceId, setInvoiceId] = useState(values.invoiceId);
  const [projectId, setProjectId] = useState(values.projectId);
  const source = sources.find((s) => s.id === sourceId);
  const invoices = (source?.invoices ?? []).filter((i) => i.currency === currency);
  const decimal = (n: number) => (locale === "en" ? n.toFixed(2) : n.toFixed(2).replace(".", ","));

  return (
    // Remount after a successful add (the server stamps each save) so the fields reset.
    <form key={state?.savedAt ?? "form"} action={action} className="flex flex-col gap-4">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      {values.back && <input type="hidden" name="back" value={values.back} />}

      <label className={fieldLabel}>
        {p.source}
        <select
          name="source_id"
          value={sourceId}
          onChange={(e) => {
            setSourceId(e.target.value);
            setInvoiceId("");
            setProjectId("");
            // The currency follows the source until the person picks one.
            if (!currencyTouched) setCurrency(sources.find((s) => s.id === e.target.value)?.currency ?? currency);
          }}
          className={fieldInput}
        >
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <div className={grid}>
        <label className={fieldLabel}>
          {p.amount}
          <input
            name="amount"
            inputMode="decimal"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1.500,00"
            className={`${fieldInput} font-mono`}
          />
        </label>
        <label className={fieldLabel}>
          {p.currency}
          <select
            name="currency"
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value);
              setCurrencyTouched(true);
              setInvoiceId("");
            }}
            className={fieldInput}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>
      <span className={`${hint} -mt-2`}>{p.amountHint}</span>

      {(invoices.length > 0 || (source?.projects.length ?? 0) > 0) && (
        <div className={grid}>
          {invoices.length > 0 && (
            <label className={fieldLabel}>
              {p.invoice}
              <select
                name="invoice_id"
                value={invoiceId}
                onChange={(e) => {
                  const invoice = invoices.find((i) => i.id === e.target.value);
                  setInvoiceId(e.target.value);
                  // The invoice fills in what's left on it and its project.
                  if (invoice && !amount) setAmount(decimal(invoice.balance));
                  if (invoice?.projectId) setProjectId(invoice.projectId);
                }}
                className={fieldInput}
              >
                <option value="">{p.noInvoice}</option>
                {invoices.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.number} · {fill(t.invoices.balance, { amount: formatMoney(currencySymbol(i.currency), i.balance, locale) })}
                  </option>
                ))}
              </select>
            </label>
          )}
          {(source?.projects.length ?? 0) > 0 && (
            <label className={fieldLabel}>
              {p.project}
              <select name="project_id" value={projectId} onChange={(e) => setProjectId(e.target.value)} className={fieldInput}>
                <option value="">{t.entry.noProject}</option>
                {source!.projects.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    {pr.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}

      <div className={grid}>
        <label className={fieldLabel}>
          {p.receivedOn}
          <input type="date" name="received_on" required max={maxDate} defaultValue={values.receivedOn} className={fieldInput} />
        </label>
        <label className={fieldLabel}>
          {p.method}
          <select name="method" defaultValue={values.method} className={fieldInput}>
            <option value="">{p.noMethod}</option>
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {p.methods[m]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {currency !== "BRL" && (
        <label className={fieldLabel}>
          <span>
            {p.brl} <span className={hint}>({t.common.optional})</span>
          </span>
          <input name="amount_brl_received" inputMode="decimal" defaultValue={values.brl} placeholder="R$" className={`${fieldInput} font-mono`} />
          <span className={hint}>{p.brlHint}</span>
        </label>
      )}

      <details open={Boolean(values.periodStart)} className="rounded-[12px] border border-line px-4 py-3">
        <summary className="cursor-pointer text-[14px] font-bold">{p.period}</summary>
        <div className="flex flex-col gap-3 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <label className={fieldLabel}>
              {p.periodStart}
              <input type="date" name="period_start" defaultValue={values.periodStart} className={fieldInput} />
            </label>
            <label className={fieldLabel}>
              {p.periodEnd}
              <input type="date" name="period_end" defaultValue={values.periodEnd} className={fieldInput} />
            </label>
          </div>
          <span className={hint}>{p.periodHint}</span>
        </div>
      </details>

      <FormMessage t={t} state={state} okText={p.added} errors={p.errors} />
      <SubmitButton pending={pending} label={values.id ? t.common.save : p.add} pendingLabel={t.common.saving} />
    </form>
  );
}
