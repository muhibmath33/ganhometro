"use client";

import { useState } from "react";
import type { CalculatorsDictionary } from "@/i18n/calculators";
import { fill, type Locale } from "@/i18n/config";
import { parseNumber } from "@/lib/calc";
import { CURRENCIES, CURRENCY_SYMBOL, type Currency, FALLBACK_RATE, fieldGrid, formatDay, formatRate, hintClass, inputClass, labelClass, type Rates, selectClass } from "./shared";

// Monthly amount, currency and exchange rate. The rate starts at today's PTAX for the currency and follows
// the currency until the person types their own.
export function useAmount(rates: Rates, locale: Locale) {
  const rateFor = (c: Currency) => formatRate(rates[c]?.rate ?? FALLBACK_RATE[c], locale);
  const [amount, setAmount] = useState("3000");
  const [currency, setCurrency] = useState<Currency | "BRL">("USD");
  const [rate, setRate] = useState(rateFor("USD"));
  const [rateEdited, setRateEdited] = useState(false);

  return {
    amount,
    setAmount,
    currency,
    setCurrency(c: Currency | "BRL") {
      setCurrency(c);
      if (c !== "BRL" && !rateEdited) setRate(rateFor(c));
    },
    rate,
    setRate(value: string) {
      setRate(value);
      setRateEdited(true);
    },
    rateEdited,
    gross: currency === "BRL" ? parseNumber(amount) : parseNumber(amount) * parseNumber(rate),
  };
}

export function AmountFields({
  state,
  t,
  locale,
  rates,
  allowBrl = false,
  onChange,
}: {
  state: ReturnType<typeof useAmount>;
  t: CalculatorsDictionary["common"];
  locale: Locale;
  rates: Rates;
  allowBrl?: boolean;
  onChange: () => void;
}) {
  const { currency } = state;
  const today = currency !== "BRL" ? rates[currency] : undefined;
  return (
    <div className={fieldGrid}>
      <label className={labelClass}>
        {t.amount}
        <input
          inputMode="decimal"
          value={state.amount}
          onChange={(e) => {
            state.setAmount(e.target.value);
            onChange();
          }}
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        {t.currency}
        <select
          value={currency}
          onChange={(e) => {
            state.setCurrency(e.target.value as Currency | "BRL");
            onChange();
          }}
          className={selectClass}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {CURRENCY_SYMBOL[c]} ({c})
            </option>
          ))}
          {allowBrl && <option value="BRL">R$ (BRL)</option>}
        </select>
      </label>
      {currency !== "BRL" && (
        <label className={labelClass}>
          {fill(t.rate, { currency: CURRENCY_SYMBOL[currency] })}
          <input
            inputMode="decimal"
            value={state.rate}
            onChange={(e) => {
              state.setRate(e.target.value);
              onChange();
            }}
            className={inputClass}
          />
          {!state.rateEdited && (
            <span className={hintClass}>{today ? fill(t.rateToday, { date: formatDay(today.date, locale) }) : t.rateFallback}</span>
          )}
        </label>
      )}
    </div>
  );
}
