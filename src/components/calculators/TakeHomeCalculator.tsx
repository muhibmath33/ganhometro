"use client";

import Link from "next/link";
import { useState } from "react";
import type { CalculatorsDictionary } from "@/i18n/calculators";
import { fill, type Locale, routes } from "@/i18n/config";
import { parseNumber } from "@/lib/calc";
import { companyMonth, individualMonth, type InssPlan } from "@/lib/money/tax";
import { AmountFields, useAmount } from "./AmountFields";
import { AmountRow, brl, fieldGrid, hintClass, inputClass, labelClass, NetBar, panelClass, type Rates, selectClass } from "./shared";
import { useTrackOnce } from "./useTrackOnce";

const INSS_PLANS: InssPlan[] = ["full", "simplified", "none"];

// Quanto sobra: what's left of a monthly income from abroad after fees, exchange, INSS and tax.
export function TakeHomeCalculator({ t, locale, rates }: { t: CalculatorsDictionary; locale: Locale; rates: Rates }) {
  const c = t.common;
  const tt = t.takeHome;
  const used = useTrackOnce("take_home", locale);
  const money = useAmount(rates, locale);
  const [fees, setFees] = useState(locale === "en" ? "1.5" : "1,5");
  const [receiveAs, setReceiveAs] = useState<"pf" | "cnpj">("pf");
  const [inss, setInss] = useState<InssPlan>("full");
  const [dependents, setDependents] = useState("0");
  const [accountant, setAccountant] = useState("250");

  const gross = Math.max(0, money.gross);
  const feeCost = (gross * Math.min(Math.max(parseNumber(fees), 0), 100)) / 100;
  const pf = individualMonth(gross, { inss, dependents: Math.max(0, Math.floor(parseNumber(dependents))) });
  const pj = companyMonth(gross, { accountant: Math.max(0, parseNumber(accountant)) });
  const pfKept = pf.net - feeCost;
  const pjKept = pj ? pj.net - feeCost : null;

  const kept = receiveAs === "pf" ? pfKept : pjKept;
  const taxes = receiveAs === "pf" ? pf.inss + pf.tax : pj ? pj.das + pj.inss + pj.irrf : 0;
  const costs = receiveAs === "pf" ? feeCost : feeCost + (pj?.accountant ?? 0);
  const share = gross > 0 && kept !== null ? Math.round((kept / gross) * 100) : 0;

  const field = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    used();
  };

  return (
    <div className="flex flex-wrap items-start gap-5">
      <div className={`${panelClass} flex-[1_1_420px]`}>
        <AmountFields state={money} t={c} locale={locale} rates={rates} onChange={used} />
        <div className={fieldGrid}>
          <label className={labelClass}>
            {c.fees}
            <input inputMode="decimal" value={fees} onChange={field(setFees)} className={inputClass} />
            <span className={hintClass}>{c.feesHint}</span>
          </label>
          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="mb-2 text-[14px] font-bold">{c.receiveAs}</legend>
            <div className="flex flex-wrap gap-2">
              {(["pf", "cnpj"] as const).map((k) => (
                <label
                  key={k}
                  className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-[10px] border px-3.5 text-[15px] font-semibold ${
                    receiveAs === k ? "border-brand bg-brand-tint text-brand" : "border-field bg-white text-ink"
                  }`}
                >
                  <input
                    type="radio"
                    name="receive-as"
                    checked={receiveAs === k}
                    onChange={() => {
                      setReceiveAs(k);
                      used();
                    }}
                    className="accent-brand"
                  />
                  {c.receiveOptions[k]}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        {receiveAs === "pf" ? (
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
          </div>
        ) : (
          <div className={fieldGrid}>
            <label className={labelClass}>
              {c.accountant}
              <input inputMode="decimal" value={accountant} onChange={field(setAccountant)} className={inputClass} />
            </label>
          </div>
        )}
      </div>

      <div aria-live="polite" className={`${panelClass} flex-[1_1_340px]`}>
        {kept === null ? (
          <p className="m-0 text-[15px] text-ink-soft">{tt.tooHigh}</p>
        ) : (
          <>
            <div className="flex flex-col gap-1 rounded-[14px] bg-ink px-5 py-4 text-white">
              <span className="text-[13px] font-semibold text-night-text">{tt.left}</span>
              <span className="font-mono text-[34px] leading-tight font-semibold text-mint">
                {brl(kept, locale)}
                <span className="font-sans text-[15px] font-medium text-night-text">{c.perMonth}</span>
              </span>
              <span className="text-[14px] text-night-text">{fill(tt.share, { n: share })}</span>
            </div>
            <NetBar kept={kept} taxes={taxes} costs={costs} legend={tt.legend} />
            <dl className="m-0 flex flex-col">
              <AmountRow label={tt.rows.gross} amount={gross} locale={locale} strong />
              <AmountRow label={tt.rows.fees} amount={-feeCost} locale={locale} />
              {receiveAs === "pf" ? (
                <>
                  <AmountRow label={tt.rows.inss} amount={-pf.inss} locale={locale} />
                  <AmountRow label={tt.rows.tax} amount={-pf.tax} locale={locale} />
                </>
              ) : (
                pj && (
                  <>
                    <AmountRow label={tt.rows.das} amount={-pj.das} locale={locale} />
                    <AmountRow label={tt.rows.proLaboreInss} amount={-pj.inss} locale={locale} />
                    <AmountRow label={tt.rows.proLaboreTax} amount={-pj.irrf} locale={locale} />
                    <AmountRow label={tt.rows.accountant} amount={-pj.accountant} locale={locale} />
                  </>
                )
              )}
            </dl>
            <p className="m-0 text-[14px] leading-[1.5] text-ink">
              {receiveAs === "pf"
                ? pjKept !== null &&
                  fill(pjKept > pfKept ? tt.compareCnpj : tt.compareCnpjWorse, { amount: brl(pjKept, locale), diff: brl(pjKept - pfKept, locale) })
                : fill(tt.comparePf, { amount: brl(pfKept, locale) })}{" "}
              <Link href={routes.calcCompany[locale]} className="font-semibold">
                {tt.compareLink}
              </Link>
            </p>
          </>
        )}
        <p className="m-0 text-[12px] leading-[1.5] text-muted">{c.estimate}</p>
      </div>
    </div>
  );
}
