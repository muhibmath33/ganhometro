// Calculator logic ported 1:1 from the Main.dc.html design (Handoff §4).
// Only the output text and number format depend on the language.

import { fill, type Locale } from "@/i18n/config";

export type CalcMessages = {
  gapLess: string;
  gapMore: string;
  gapSame: string;
  unpaidShare: string;
};

export type CalcInput = {
  listed: string;
  received: string;
  paid: string;
  unpaid: string;
  rate: string;
};

export type CalcResult = {
  realBrl: string;
  realUsd: string;
  gapText: string;
  unpaidShare: string;
};

// Brazilian input: if the string has ",", drop "." and turn "," into "."; otherwise drop ",".
export function parseNumber(s: string): number {
  let t = String(s || "").trim();
  if (t.indexOf(",") >= 0) {
    t = t.replace(/\./g, "").replace(",", ".");
  } else {
    t = t.replace(/,/g, "");
  }
  const n = parseFloat(t);
  return isNaN(n) ? 0 : n;
}

// "R$ 1.234,56" (pt-BR) or "R$ 1,234.56" (en)
export function formatMoney(prefix: string, n: number, locale: Locale = "pt-BR"): string {
  const fixed = n.toFixed(2);
  const number =
    locale === "en"
      ? fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      : fixed.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return prefix + " " + number;
}

export function calculate(input: CalcInput, messages: CalcMessages, locale: Locale = "pt-BR"): CalcResult {
  const listed = parseNumber(input.listed);
  const received = parseNumber(input.received);
  const paid = parseNumber(input.paid);
  const unpaid = parseNumber(input.unpaid);
  const rate = parseNumber(input.rate);

  const hours = paid + unpaid;
  const realUsd = hours > 0 ? received / hours : 0;
  const realBrl = realUsd * rate;

  let gapText = "—";
  if (listed > 0 && hours > 0) {
    const pct = Math.round((1 - realUsd / listed) * 100);
    gapText =
      pct > 0
        ? fill(messages.gapLess, { n: pct })
        : pct < 0
          ? fill(messages.gapMore, { n: Math.abs(pct) })
          : messages.gapSame;
  }
  const unpaidShare =
    hours > 0 ? fill(messages.unpaidShare, { n: Math.round((unpaid / hours) * 100) }) : "—";

  return {
    realBrl: formatMoney("R$", realBrl, locale) + "/h",
    realUsd: formatMoney("US$", realUsd, locale) + "/h",
    gapText,
    unpaidShare,
  };
}
