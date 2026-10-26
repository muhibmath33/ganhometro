"use client";

import { useState } from "react";
import type { CalculatorsDictionary } from "@/i18n/calculators";
import { fill, type Locale } from "@/i18n/config";
import { parseNumber } from "@/lib/calc";
import { companyBreakEven, companyMonth, individualMonth, type InssPlan } from "@/lib/money/tax";
import { AmountFields, useAmount } from "./AmountFields";
import { AmountRow, brl, fieldGrid, inputClass, labelClass, panelClass, type Rates, reais, selectClass } from "./shared";
import { useTrackOnce } from "./useTrackOnce";

const INSS_PLANS: InssPlan[] = ["full", "simplified", "none"];
const REFERENCE_INCOMES = [5000, 7350, 10000, 15000, 20000, 30000, 50000];

// PF ou CNPJ: the same monthly income as an individual (carnê-leão) and as a Simples Nacional company.
export function CompanyCalculator({ t, locale, rates }: { t: CalculatorsDictionary; locale: Locale; rates: Rates }) {
  const c = t.common;
  const tc = t.company;
  const rows = t.takeHome.rows;
  const used = useTrackOnce("company", locale);
  const money = useAmount(rates, locale);
  const [inss, setInss] = useState<InssPlan>("full");
  const [dependents, setDependents] = useState("0");
  const [accountant, setAccountant] = useState("250");

  const options = {
    inss,
    dependents: Math.max(0, Math.floor(parseNumber(dependents))),
    accountant: Math.max(0, parseNumber(accountant)),
  };
  const gross = Math.max(0, money.gross);
  const pf = individualMonth(gross, options);
  const pj = companyMonth(gross, options);
  const diff = pj ? pj.net - pf.net : 0;
  const breakEven = companyBreakEven(options);
  const verdict = !pj ? null : Math.abs(diff) < 50 ? tc.better.same : diff > 0 ? tc.better.pj : tc.better.pf;

  const field = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    used();
  };
  const card = (title: string, net: number, best: boolean, children: React.ReactNode) => (
    <div className={`flex min-w-0 flex-col gap-3 rounded-2xl border bg-white p-5 ${best ? "border-2 border-brand" : "border-line"}`}>
      <h2 className="m-0 text-[17px] font-bold">{title}</h2>
      <dl className="m-0 flex flex-col">{children}</dl>
      <div className="flex items-baseline justify-between gap-3 rounded-[12px] bg-paper px-4 py-3">
        <span className="text-[14px] font-bold">{tc.left}</span>
        <span className="font-mono text-[22px] font-semibold">
          {brl(net, locale)}
          <span className="font-sans text-[13px] font-medium text-muted">{c.perMonth}</span>
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className={panelClass}>
        <AmountFields state={money} t={c} locale={locale} rates={rates} allowBrl onChange={used} />
        <div className={fieldGrid}>
          <label className={labelClass}>
            {c.inss}
            <select
              value={inss}
              onChange={(e) => {
                setInss(e.target.value as InssPlan);
                used();
              }}
              className={selectClass}
            >
              {INSS_PLANS.map((p) => (
                <option key={p} value={p}>
                  {c.inssOptions[p]}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            {c.dependents}
            <input inputMode="numeric" value={dependents} onChange={field(setDependents)} className={inputClass} />
          </label>
          <label className={labelClass}>
            {c.accountant}
            <input inputMode="decimal" value={accountant} onChange={field(setAccountant)} className={inputClass} />
          </label>
        </div>
      </div>

      <div aria-live="polite" className="flex flex-col gap-4">
        {pj ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {card(
              tc.pf,
              pf.net,
              pf.net > pj.net + 50,
              <>
                <AmountRow label={rows.gross} amount={gross} locale={locale} strong />
                <AmountRow label={rows.inss} amount={-pf.inss} locale={locale} />
                <AmountRow label={rows.tax} amount={-pf.tax} locale={locale} />
              </>,
            )}
            {card(
              tc.pj,
              pj.net,
              pj.net > pf.net + 50,
              <>
                <AmountRow label={rows.gross} amount={gross} locale={locale} strong />
                <AmountRow label={rows.das} amount={-pj.das} locale={locale} />
                <AmountRow label={rows.proLaboreInss} amount={-pj.inss} locale={locale} />
                <AmountRow label={rows.proLaboreTax} amount={-pj.irrf} locale={locale} />
                <AmountRow label={rows.accountant} amount={-pj.accountant} locale={locale} />
              </>,
            )}
          </div>
        ) : (
          <p className="m-0 text-[15px] text-ink-soft">{t.takeHome.tooHigh}</p>
        )}
        {verdict && (
          <p className="m-0 rounded-[12px] bg-ink px-4 py-3 text-[15px] leading-[1.5] font-semibold text-white">
            {fill(verdict, { diff: brl(Math.abs(diff), locale), year: brl(Math.abs(diff) * 12, locale) })}
          </p>
        )}
        <p className="m-0 text-[14px] text-ink-soft">
          {breakEven ? fill(tc.breakEven, { amount: brl(breakEven, locale) }) : tc.noBreakEven}
        </p>
      </div>

      <div className={panelClass}>
        <div className="flex flex-col gap-1">
          <h2 className="m-0 text-[17px] font-bold">{tc.tableTitle}</h2>
          <p className="m-0 text-[13px] text-muted">{tc.tableNote}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[14px]">
            <thead>
              <tr className="border-b border-line text-[13px] text-muted">
                <th scope="col" className="py-2 pr-3 font-semibold">{tc.tableHead.income}</th>
                <th scope="col" className="py-2 pr-3 text-right font-semibold">{tc.tableHead.pf}</th>
                <th scope="col" className="py-2 pr-3 text-right font-semibold">{tc.tableHead.pj}</th>
                <th scope="col" className="py-2 text-right font-semibold">{tc.tableHead.diff}</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {REFERENCE_INCOMES.map((income) => {
                const a = individualMonth(income, options).net;
                const b = companyMonth(income, options)?.net ?? 0;
                return (
                  <tr key={income} className="border-b border-line last:border-b-0">
                    <td className="py-2 pr-3">{reais(income, locale)}</td>
                    <td className="py-2 pr-3 text-right">{reais(a, locale)}</td>
                    <td className="py-2 pr-3 text-right">{reais(b, locale)}</td>
                    <td className={`py-2 text-right font-semibold whitespace-nowrap ${b > a ? "text-brand" : "text-amber-ink"}`}>
                      {b > a ? "+" : "−"}
                      {reais(Math.abs(b - a), locale)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="m-0 text-[12px] leading-[1.5] text-muted">{c.estimate}</p>
      </div>
    </div>
  );
}
