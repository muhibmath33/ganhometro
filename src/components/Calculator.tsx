"use client";

import { useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { calculate, type CalcInput } from "@/lib/calc";

const fields: { key: keyof CalcInput; label: string }[] = [
  { key: "listed", label: "Valor anunciado (US$/h)" },
  { key: "received", label: "Valor recebido (US$)" },
  { key: "paid", label: "Horas pagas" },
  { key: "unpaid", label: "Horas não pagas" },
  { key: "rate", label: "Cotação do dólar (R$)" },
];

export function Calculator() {
  const [values, setValues] = useState<CalcInput>({
    listed: "25",
    received: "200",
    paid: "8",
    unpaid: "6",
    rate: "5,10",
  });
  const tracked = useRef(false);
  const result = calculate(values);

  function update(key: keyof CalcInput, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    if (!tracked.current) {
      tracked.current = true;
      track("Calculator used");
    }
  }

  return (
    <div className="flex flex-wrap items-stretch gap-5">
      <div className="grid min-w-0 flex-[1_1_420px] grid-cols-[repeat(auto-fit,minmax(min(170px,100%),1fr))] gap-4 rounded-2xl border border-line bg-white p-6">
        {fields.map((f) => (
          <label key={f.key} className="flex flex-col gap-2 text-[14px] font-bold">
            {f.label}
            <input
              type="text"
              inputMode="decimal"
              value={values[f.key]}
              onChange={(e) => update(f.key, e.target.value)}
              className="min-h-[50px] rounded-[10px] border border-field bg-white px-3.5 font-mono text-[18px] font-semibold text-ink"
            />
          </label>
        ))}
        <p className="m-0 self-end text-[13px] leading-[1.5] text-muted">
          Horas não pagas: diretrizes, testes, espera por tarefas e retrabalho. Os
          valores iniciais são só um exemplo.
        </p>
      </div>

      <div
        aria-live="polite"
        className="flex min-w-0 flex-[1_1_340px] flex-col gap-4 rounded-2xl bg-ink p-6 text-white"
      >
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-semibold text-night-text">Ganho real por hora</span>
          <span className="font-mono text-[40px] font-semibold text-mint">{result.realBrl}</span>
          <span className="font-mono text-[16px] text-night-text">{result.realUsd}</span>
        </div>
        <div className="flex flex-col gap-1 border-t border-night-line pt-3">
          <span className="text-[13px] font-semibold text-night-text">
            Comparado ao valor anunciado
          </span>
          <span className="text-[22px] font-extrabold text-gold">{result.gapText}</span>
        </div>
        <div className="flex flex-col gap-1 border-t border-night-line pt-3">
          <span className="text-[13px] font-semibold text-night-text">Tempo não pago</span>
          <span className="text-[18px] font-bold">{result.unpaidShare}</span>
        </div>
      </div>
    </div>
  );
}
