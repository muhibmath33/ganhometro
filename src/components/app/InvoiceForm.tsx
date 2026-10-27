"use client";

import { useActionState, useState, useTransition } from "react";
import { type InvoiceFormState, invoiceFromHours, saveInvoice } from "@/app/app/actions";
import type { AppDictionary } from "@/i18n/app";
import { fill, type Locale } from "@/i18n/config";
import { INVOICE_STATUSES, type InvoiceStatus } from "@/lib/app/invoices";
import { CURRENCIES, currencySymbol } from "@/lib/app/sources";
import { addDays, formatDuration } from "@/lib/app/time";
import { formatMoney } from "@/lib/calc";
import { fieldInput, fieldLabel } from "./SourceFields";
import { FormMessage, SubmitButton } from "./ui";

export type InvoiceSource = {
  id: string;
  name: string;
  currency: string;
  terms: number | null; // payment terms in days
  projects: { id: string; name: string; fixedPrice: number | null }[];
};
export type InvoiceValues = {
  id?: string;
  sourceId: string;
  projectId: string;
  number: string;
  issuedOn: string;
  dueOn: string;
  amount: string;
  currency: string;
  periodStart: string;
  periodEnd: string;
  status: InvoiceStatus;
};

const hint = "text-[12px] font-normal text-muted";
const grid = "grid grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] gap-4";

// Create an invoice (no id) or edit one. The due date follows the client's payment terms until it's changed.
export function InvoiceForm({ t, locale, sources, values }: { t: AppDictionary; locale: Locale; sources: InvoiceSource[]; values: InvoiceValues }) {
  const f = t.invoices.form;
  const [state, action, pending] = useActionState<InvoiceFormState, FormData>(saveInvoice, null);
  const [sourceId, setSourceId] = useState(values.sourceId);
  const [projectId, setProjectId] = useState(values.projectId);
  const [issuedOn, setIssuedOn] = useState(values.issuedOn);
  const [dueOn, setDueOn] = useState(values.dueOn);
  const [dueTouched, setDueTouched] = useState(Boolean(values.id));
  const [currency, setCurrency] = useState(values.currency);
  const [amount, setAmount] = useState(values.amount);
  const [periodStart, setPeriodStart] = useState(values.periodStart);
  const [periodEnd, setPeriodEnd] = useState(values.periodEnd);
  const [calc, setCalc] = useState<string | null>(null);
  const [calculating, startCalc] = useTransition();
  const source = sources.find((s) => s.id === sourceId);
  const decimal = (n: number) => (locale === "en" ? n.toFixed(2) : n.toFixed(2).replace(".", ","));

  const dueFor = (issued: string, s = source) => (s?.terms != null && issued ? addDays(issued, s.terms) : issued);
  const chooseSource = (id: string) => {
    const next = sources.find((s) => s.id === id);
    setSourceId(id);
    setProjectId("");
    if (next && !values.id) setCurrency(next.currency);
    if (!dueTouched) setDueOn(dueFor(issuedOn, next));
  };
  const chooseProject = (id: string) => {
    setProjectId(id);
    // A fixed-price project fills in its price.
    const price = source?.projects.find((p) => p.id === id)?.fixedPrice;
    if (price != null && !amount) setAmount(decimal(price));
  };
  const calculate = () =>
    startCalc(async () => {
      const r = await invoiceFromHours({ sourceId, projectId, from: periodStart, to: periodEnd || issuedOn });
      if ("error" in r) {
        setCalc(r.error === "noHours" ? f.noHours : r.error === "noRate" ? f.noRate : r.error === "pro" ? t.plans.needPro : t.invoices.errors.period);
        return;
      }
      const symbol = currencySymbol(currency);
      setAmount(decimal(r.amount));
      setCalc(
        fill(f.calculated, {
          hours: formatDuration(r.hours * 3_600_000, locale),
          rate: `${formatMoney(symbol, r.rate, locale)}/h`,
          amount: formatMoney(symbol, r.amount, locale),
        }),
      );
    });

  return (
    <form action={action} className="flex flex-col gap-4">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <div className={grid}>
        <label className={fieldLabel}>
          {f.client}
          <select name="source_id" value={sourceId} onChange={(e) => chooseSource(e.target.value)} className={fieldInput}>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        {source && source.projects.length > 0 && (
          <label className={fieldLabel}>
            {f.project}
            <select name="project_id" value={projectId} onChange={(e) => chooseProject(e.target.value)} className={fieldInput}>
              <option value="">{t.entry.noProject}</option>
              {source.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className={grid}>
        <label className={fieldLabel}>
          {f.number}
          <input name="number" required maxLength={30} defaultValue={values.number} className={`${fieldInput} font-mono`} />
        </label>
        <label className={fieldLabel}>
          {f.issued}
          <input
            type="date"
            name="issued_on"
            required
            value={issuedOn}
            onChange={(e) => {
              setIssuedOn(e.target.value);
              if (!dueTouched) setDueOn(dueFor(e.target.value));
            }}
            className={fieldInput}
          />
        </label>
        <label className={fieldLabel}>
          {f.due}
          <input
            type="date"
            name="due_on"
            required
            min={issuedOn}
            value={dueOn}
            onChange={(e) => {
              setDueOn(e.target.value);
              setDueTouched(true);
            }}
            className={fieldInput}
          />
          <span className={hint}>{f.dueHint}</span>
        </label>
      </div>

      <details open={Boolean(values.periodStart)} className="rounded-[12px] border border-line px-4 py-3">
        <summary className="cursor-pointer text-[14px] font-bold">{f.period}</summary>
        <div className="flex flex-col gap-3 pt-3">
          <span className={hint}>{f.periodHint}</span>
          <div className="grid grid-cols-2 gap-3">
            <label className={fieldLabel}>
              {f.periodStart}
              <input type="date" name="period_start" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className={fieldInput} />
            </label>
            <label className={fieldLabel}>
              {f.periodEnd}
              <input type="date" name="period_end" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className={fieldInput} />
            </label>
          </div>
          <button
            type="button"
            onClick={calculate}
            disabled={!periodStart || calculating}
            className="min-h-11 cursor-pointer self-start rounded-[10px] border border-brand bg-white px-4 font-sans text-[14px] font-bold text-brand disabled:cursor-default disabled:opacity-50"
          >
            {calculating ? t.common.saving : f.calculate}
          </button>
          {calc && (
            <p role="status" className="m-0 text-[13px] font-semibold text-ink-soft">
              {calc}
            </p>
          )}
        </div>
      </details>

      <div className={grid}>
        <label className={fieldLabel}>
          {f.amount}
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
          {f.currency}
          <select name="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className={fieldInput}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className={fieldLabel}>
          {f.status}
          <select name="status" defaultValue={values.status} className={fieldInput}>
            {INVOICE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {f.statuses[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <FormMessage t={t} state={state} errors={t.invoices.errors} />
      <SubmitButton pending={pending} label={values.id ? t.common.save : f.create} pendingLabel={t.common.saving} />
    </form>
  );
}
