// Numbers, dates and hours as each document language writes them. English documents use currency codes
// ("USD 1,234.56"), which read clearly abroad; Portuguese ones use the app's style ("US$ 1.234,56").
import type { DocLang } from "@/i18n/documents";
import { currencySymbol } from "@/lib/app/sources";
import { formatDuration } from "@/lib/app/time";
import { formatMoney } from "@/lib/calc";

export function docMoney(currency: string, n: number, lang: DocLang): string {
  if (lang === "pt") return formatMoney(currencySymbol(currency), n, "pt-BR");
  return `${currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// "R$ 5,4321" / "BRL 5.4321": an exchange rate, with four decimals.
export function docRate(n: number, lang: DocLang): string {
  const text = n.toFixed(4);
  return lang === "pt" ? `R$ ${text.replace(".", ",")}` : `BRL ${text}`;
}

// "27/10/2026" / "Oct 27, 2026", for a day ("2026-10-27").
export function docDate(day: string, lang: DocLang): string {
  const date = new Date(`${day}T12:00:00Z`);
  return lang === "pt"
    ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(date)
    : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date);
}

// "outubro de 2026" / "October 2026", for a month ("2026-10").
export function docMonth(key: string, lang: DocLang): string {
  return new Intl.DateTimeFormat(lang === "pt" ? "pt-BR" : "en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${key}-15T12:00:00Z`),
  );
}

// "20/10/2026 a 26/10/2026", or a single day when the period is one day.
export const docPeriod = (template: string, from: string, to: string, lang: DocLang) =>
  from === to ? docDate(from, lang) : template.replace("{from}", docDate(from, lang)).replace("{to}", docDate(to, lang));

export const docHours = (hours: number, lang: DocLang) => formatDuration(hours * 3_600_000, lang === "pt" ? "pt-BR" : "en");

// A file name without accents or spaces: "comprovante-2026-08-a-2026-10.pdf".
export const fileName = (...parts: string[]) =>
  parts
    .join("-")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
