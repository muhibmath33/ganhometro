"use client";

import { useActionState, useState } from "react";
import { importPayments } from "@/app/app/actions";
import type { AppDictionary } from "@/i18n/app";
import { fill, type Locale } from "@/i18n/config";
import { METHODS } from "@/lib/app/payments";
import { readStatement, type StatementResult } from "@/lib/app/statementImport";
import { currencySymbol } from "@/lib/app/sources";
import { formatMoney } from "@/lib/calc";
import { formatDay } from "../calculators/shared";
import { fieldInput, fieldLabel } from "./SourceFields";

const METHOD_BY_FORMAT: Record<StatementResult["format"], string> = { wise: "wise", wise_history: "wise", upwork: "upwork", payoneer: "payoneer", generic: "" };

// Pick a statement file, check the incoming payments it found, choose the client for each, import.
// The file is read here; only the picked rows' date, amount, currency and reference go to the server.
export function StatementImport({ t, locale, sources }: { t: AppDictionary; locale: Locale; sources: { id: string; name: string }[] }) {
  const s = t.statement;
  const [result, setResult] = useState<StatementResult | null>(null);
  const [picked, setPicked] = useState<boolean[]>([]);
  const [rowSource, setRowSource] = useState<string[]>([]);
  const [allSource, setAllSource] = useState(sources[0]?.id ?? "");
  const [method, setMethod] = useState("");
  const [state, action, pending] = useActionState(importPayments, null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    const read = readStatement(await file.text());
    setResult(read);
    setPicked(read.rows.map(() => true));
    // Guess the client from the description when a source's name appears in it.
    setRowSource(read.rows.map((r) => sources.find((src) => r.description.toLowerCase().includes(src.name.toLowerCase()))?.id ?? allSource));
    setMethod(METHOD_BY_FORMAT[read.format]);
  }

  const chosen = result ? result.rows.map((r, i) => ({ ...r, source_id: rowSource[i] })).filter((_, i) => picked[i]) : [];

  return (
    <div className="flex flex-col gap-4">
      <label className={fieldLabel}>
        {s.file}
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => onFile(e.target.files?.[0])}
          className="min-h-12 w-full rounded-[10px] border border-field bg-white px-3 py-2.5 font-sans text-[15px] text-ink"
        />
      </label>

      {result && (
        <div role="status" className="flex flex-col gap-1 text-[14px] text-ink-soft">
          {result.rows.length ? (
            <span className="font-semibold text-ink">{fill(s.found, { format: s.formats[result.format], n: result.rows.length })}</span>
          ) : (
            <span className="font-semibold text-amber-ink">{s.none}</span>
          )}
          {result.skipped > 0 && <span>{fill(s.skipped, { n: result.skipped })}</span>}
        </div>
      )}

      {result && result.rows.length > 0 && (
        <form action={action} className="flex flex-col gap-4">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] items-end gap-3">
            <label className={fieldLabel}>
              {s.source}
              <select value={allSource} onChange={(e) => setAllSource(e.target.value)} className={fieldInput}>
                {sources.map((src) => (
                  <option key={src.id} value={src.id}>
                    {src.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setRowSource(result.rows.map(() => allSource))}
              className="min-h-12 cursor-pointer rounded-[10px] border border-line bg-white px-4 font-sans text-[14px] font-semibold text-ink"
            >
              {s.applyAll}
            </button>
            <label className={fieldLabel}>
              {s.method}
              <select name="method" value={method} onChange={(e) => setMethod(e.target.value)} className={fieldInput}>
                <option value="">{t.payment.noMethod}</option>
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {t.payment.methods[m]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {result.rows.map((r, i) => (
              <li key={r.ref} className="flex flex-wrap items-center gap-3 rounded-[12px] bg-paper px-4 py-3">
                <input
                  type="checkbox"
                  aria-label={`${s.head.use}: ${formatDay(r.day, locale)}, ${formatMoney(currencySymbol(r.currency), r.amount, locale)}`}
                  checked={picked[i] ?? false}
                  onChange={(e) => setPicked((p) => p.map((v, j) => (j === i ? e.target.checked : v)))}
                  className="size-5 shrink-0 cursor-pointer accent-brand"
                />
                <div className="flex min-w-0 flex-[1_1_200px] flex-col">
                  <span className="text-[15px] font-bold">
                    {formatDay(r.day, locale)} · <span className="font-mono">{formatMoney(currencySymbol(r.currency), r.amount, locale)}</span>
                  </span>
                  {r.description && <span className="truncate text-[12px] text-muted">{r.description}</span>}
                </div>
                <select
                  aria-label={s.head.source}
                  value={rowSource[i] ?? allSource}
                  onChange={(e) => setRowSource((v) => v.map((x, j) => (j === i ? e.target.value : x)))}
                  className="min-h-11 flex-[1_1_160px] rounded-[10px] border border-field bg-white px-3 font-sans text-[14px] text-ink"
                >
                  {sources.map((src) => (
                    <option key={src.id} value={src.id}>
                      {src.name}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>

          <input
            type="hidden"
            name="rows"
            value={JSON.stringify(chosen.map(({ day, amount, currency, source_id, ref }) => ({ day, amount, currency, source_id, ref })))}
          />
          {state?.error && (
            <p role="alert" className="m-0 text-[14px] font-semibold text-amber-ink">
              {state.error === "source" ? t.payment.errors.source : t.common.genericError}
            </p>
          )}
          <button
            type="submit"
            disabled={pending || !chosen.length}
            className="min-h-12 cursor-pointer self-start rounded-[10px] border-0 bg-brand px-5 font-sans text-[16px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? s.importing : fill(s.submit, { n: chosen.length })}
          </button>
        </form>
      )}
    </div>
  );
}
