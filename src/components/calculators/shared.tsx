// Pieces shared by the free calculators (src/app/calculadoras, src/app/en/calculators) and the
// /freelancers example card. No hooks here, so server components can use them too.
import type { Locale } from "@/i18n/config";
import { formatMoney } from "@/lib/calc";

export const labelClass = "flex flex-col gap-2 text-[14px] font-bold";
export const inputClass =
  "min-h-[50px] w-full rounded-[10px] border border-field bg-white px-3.5 font-mono text-[18px] font-semibold text-ink";
export const selectClass =
  "min-h-[50px] w-full cursor-pointer rounded-[10px] border border-field bg-white px-3 font-sans text-[16px] font-medium text-ink";
export const hintClass = "text-[12px] leading-[1.45] font-normal text-muted";
export const panelClass = "flex min-w-0 flex-col gap-4 rounded-2xl border border-line bg-white p-6";
export const fieldGrid = "grid grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] gap-4";

export type Currency = "USD" | "EUR" | "GBP";
export type Rates = Partial<Record<Currency, { rate: number; date: string }>>;
export const CURRENCIES: Currency[] = ["USD", "EUR", "GBP"];
export const CURRENCY_SYMBOL: Record<Currency | "BRL", string> = { USD: "US$", EUR: "€", GBP: "£", BRL: "R$" };
// Used only when the Banco Central can't be reached; the page then says the rate is illustrative.
export const FALLBACK_RATE: Record<Currency, number> = { USD: 5.5, EUR: 6.1, GBP: 7.2 };

// A non-breaking space, so "R$" never ends a line apart from its number.
export const brl = (n: number, locale: Locale) => formatMoney("R$", n, locale).replace(" ", "\u00a0");
// Whole reais without the symbol, for tables that say "values in reais".
export const reais = (n: number, locale: Locale) =>
  new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", { maximumFractionDigits: 0 }).format(Math.round(n));
export const formatRate = (n: number, locale: Locale) => (locale === "en" ? n.toFixed(4) : n.toFixed(4).replace(".", ","));
// "2026-10-26" → "26/10/2026" or "Oct 26, 2026"
export const formatDay = (iso: string, locale: Locale) =>
  new Intl.DateTimeFormat(locale, locale === "en" ? { dateStyle: "medium", timeZone: "UTC" } : { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T12:00:00Z`),
  );

// What's kept, what goes to taxes and INSS, and what goes to fees and costs, as one bar.
// The amounts are always listed in text next to it.
export function NetBar({
  kept,
  taxes,
  costs,
  legend,
  showLegend = true,
}: {
  kept: number;
  taxes: number;
  costs: number;
  legend: { kept: string; taxes: string; costs: string };
  showLegend?: boolean;
}) {
  const parts = [
    { key: "kept", value: Math.max(0, kept), color: "bg-chart", label: legend.kept },
    { key: "taxes", value: Math.max(0, taxes), color: "bg-unpaid", label: legend.taxes },
    { key: "costs", value: Math.max(0, costs), color: "bg-cost", label: legend.costs },
  ];
  const total = parts.reduce((sum, p) => sum + p.value, 0);
  return (
    <div className="flex flex-col gap-2">
      <div aria-hidden="true" className="flex h-3 gap-[2px] overflow-hidden rounded-full bg-paper">
        {parts.map((p) =>
          p.value > 0 ? <div key={p.key} className={`${p.color} first:rounded-l-full last:rounded-r-full`} style={{ width: `${(p.value / total) * 100}%` }} /> : null,
        )}
      </div>
      {showLegend && <NetLegend legend={legend} />}
    </div>
  );
}

export function NetLegend({ legend }: { legend: { kept: string; taxes: string; costs: string } }) {
  const items = [
    { key: "kept", color: "bg-chart", label: legend.kept },
    { key: "taxes", color: "bg-unpaid", label: legend.taxes },
    { key: "costs", color: "bg-cost", label: legend.costs },
  ];
  return (
    <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-[13px] text-ink-soft">
      {items.map((p) => (
        <span key={p.key} className="flex items-center gap-1.5">
          <span className={`size-2.5 rounded-[3px] ${p.color}`} />
          {p.label}
        </span>
      ))}
    </div>
  );
}

// One line of a breakdown: a label and an amount (negative amounts are deductions).
export function AmountRow({ label, amount, locale, strong = false }: { label: string; amount: number; locale: Locale; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 border-b border-line py-2 last:border-b-0 ${strong ? "font-bold text-ink" : "text-ink-soft"}`}>
      <dt className="text-[14px]">{label}</dt>
      <dd className="m-0 font-mono text-[15px] whitespace-nowrap text-ink">
        {amount < 0 ? "− " : ""}
        {brl(Math.abs(amount), locale)}
      </dd>
    </div>
  );
}
