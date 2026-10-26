"use client";

import { useRef, useState } from "react";
import type { Dictionary, Locale } from "@/i18n";
import { track } from "@/lib/analytics";
import { calculate, type CalcInput } from "@/lib/calc";

const fieldKeys: (keyof CalcInput)[] = ["listed", "received", "paid", "unpaid", "rate"];

export function Calculator({ t, locale }: { t: Dictionary["calculator"]; locale: Locale }) {
  const [values, setValues] = useState<CalcInput>({
    listed: "25",
    received: "200",
    paid: "8",
    unpaid: "6",
    rate: t.defaultRate,
  });
  const tracked = useRef(false);
  const result = calculate(values, t.messages, locale);

  function update(key: keyof CalcInput, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    if (!tracked.current) {
      tracked.current = true;
      track("Calculator used", { locale });
    }
  }

  return (
    <div className="flex flex-wrap items-stretch gap-5">
      <div className="grid min-w-0 flex-[1_1_420px] grid-cols-[repeat(auto-fit,minmax(min(170px,100%),1fr))] gap-4 rounded-2xl border border-line bg-white p-6">
        {fieldKeys.map((key) => (
          <label key={key} className="flex flex-col gap-2 text-[14px] font-bold">
            {t.fields[key]}
            <input
              type="text"
              inputMode="decimal"
              value={values[key]}
              onChange={(e) => update(key, e.target.value)}
              className="min-h-[50px] rounded-[10px] border border-field bg-white px-3.5 font-mono text-[18px] font-semibold text-ink"
            />
          </label>
        ))}
        <p className="m-0 self-end text-[13px] leading-[1.5] text-muted">{t.hint}</p>
      </div>

      <div
        aria-live="polite"
        className="flex min-w-0 flex-[1_1_340px] flex-col gap-4 rounded-2xl bg-ink p-6 text-white"
      >
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-semibold text-night-text">{t.realTitle}</span>
          <span className="font-mono text-[40px] font-semibold text-mint">{result.realBrl}</span>
          <span className="font-mono text-[16px] text-night-text">{result.realUsd}</span>
        </div>
        <div className="flex flex-col gap-1 border-t border-night-line pt-3">
          <span className="text-[13px] font-semibold text-night-text">{t.gapTitle}</span>
          <span className="text-[22px] font-extrabold text-gold">{result.gapText}</span>
        </div>
        <div className="flex flex-col gap-1 border-t border-night-line pt-3">
          <span className="text-[13px] font-semibold text-night-text">{t.unpaidTitle}</span>
          <span className="text-[18px] font-bold">{result.unpaidShare}</span>
        </div>
      </div>
    </div>
  );
}
