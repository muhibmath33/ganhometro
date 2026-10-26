"use client";

import { useState } from "react";
import type { CalculatorsDictionary } from "@/i18n/calculators";
import { fill, type Locale } from "@/i18n/config";
import { parseNumber } from "@/lib/calc";
import { darfDueDate, monthlyIncomeTax, round2, RULES_2026 } from "@/lib/money/tax";
import { AmountRow, brl, fieldGrid, formatDay, formatRate, hintClass, inputClass, labelClass, panelClass, selectClass } from "./shared";
import { useTrackOnce } from "./useTrackOnce";

export type CarneLeaoMonth = { year: number; month: number; rate: { rate: number; date: string } | null };

// Quanto separar para o leão: the month's carnê-leão on income in dollars, with the PTAX rule the Receita requires.
export function CarneLeaoCalculator({ t, locale, months }: { t: CalculatorsDictionary; locale: Locale; months: CarneLeaoMonth[] }) {
  const c = t.common;
  const tl = t.carneLeao;
  const used = useTrackOnce("carne_leao", locale);
  const [index, setIndex] = useState(months.length - 1);
  const [amount, setAmount] = useState("3000");
  const [inssPaid, setInssPaid] = useState("");
  const [dependents, setDependents] = useState("0");
  const [manualRate, setManualRate] = useState("");

  const chosen = months[index];
  const rate = chosen.rate?.rate ?? parseNumber(manualRate);
  const gross = round2(Math.max(0, parseNumber(amount)) * rate);
  const legal = Math.max(0, parseNumber(inssPaid)) + Math.max(0, Math.floor(parseNumber(dependents))) * RULES_2026.perDependent;
  const result = monthlyIncomeTax(gross, legal);
  const due = darfDueDate(chosen.year, chosen.month);

  const field = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    used();
  };

  return (
    <div className="flex flex-wrap items-start gap-5">
      <div className={`${panelClass} flex-[1_1_420px]`}>
        <div className={fieldGrid}>
          <label className={labelClass}>
            {tl.month}
            <select
              value={index}
              onChange={(e) => {
                setIndex(Number(e.target.value));
                used();
              }}
              className={selectClass}
            >
              {months.map((m, i) => (
                <option key={`${m.year}-${m.month}`} value={i}>
                  {t.months[m.month - 1]} {m.year}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            {tl.amount}
            <input inputMode="decimal" value={amount} onChange={field(setAmount)} className={inputClass} />
            <span className={hintClass}>{tl.amountHint}</span>
          </label>
        </div>
        <div className={fieldGrid}>
          <label className={labelClass}>
            {tl.inssPaid}
            <input inputMode="decimal" value={inssPaid} onChange={field(setInssPaid)} placeholder="0" className={inputClass} />
          </label>
          <label className={labelClass}>
            {c.dependents}
            <input inputMode="numeric" value={dependents} onChange={field(setDependents)} className={inputClass} />
          </label>
        </div>
        {chosen.rate ? (
          <p className="m-0 text-[14px] leading-[1.5] text-ink-soft">
            {fill(tl.rateUsed, { rate: `R$ ${formatRate(chosen.rate.rate, locale)}`, date: formatDay(chosen.rate.date, locale) })}
          </p>
        ) : (
          <label className={labelClass}>
            {tl.rateMissing}
            <input inputMode="decimal" value={manualRate} onChange={field(setManualRate)} placeholder="5,50" className={inputClass} />
          </label>
        )}
        <p className="m-0 text-[13px] leading-[1.5] text-muted">{tl.rateRule}</p>
      </div>

      <div aria-live="polite" className={`${panelClass} flex-[1_1_340px]`}>
        <div className="flex flex-col gap-1 rounded-[14px] bg-ink px-5 py-4 text-white">
          <span className="text-[13px] font-semibold text-night-text">{tl.rows.due}</span>
          <span className="font-mono text-[34px] leading-tight font-semibold text-mint">{brl(result.due, locale)}</span>
          <span className="text-[14px] leading-[1.45] text-white">
            {result.due >= RULES_2026.darfMin
              ? fill(tl.setAside, { amount: brl(result.due, locale), date: formatDay(due, locale) })
              : result.due > 0
                ? tl.under10
                : tl.exempt}
          </span>
        </div>
        <dl className="m-0 flex flex-col">
          <AmountRow label={tl.rows.gross} amount={gross} locale={locale} strong />
          <AmountRow
            label={`${tl.rows.deduction} (${legal > RULES_2026.simplified ? tl.rows.deductionLegal : tl.rows.deductionSimplified})`}
            amount={-result.deduction}
            locale={locale}
          />
          <AmountRow label={tl.rows.base} amount={result.base} locale={locale} />
          <AmountRow label={tl.rows.tax} amount={result.tax} locale={locale} />
          <AmountRow label={tl.rows.reduction} amount={-result.reduction} locale={locale} />
          <AmountRow label={tl.rows.due} amount={result.due} locale={locale} strong />
        </dl>
        {result.due >= RULES_2026.darfMin && <p className="m-0 text-[14px] text-ink-soft">{tl.code}</p>}
        <p className="m-0 text-[12px] leading-[1.5] text-muted">{c.estimate}</p>
      </div>
    </div>
  );
}
