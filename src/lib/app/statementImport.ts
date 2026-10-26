// Reads a payment service's statement (CSV) in the browser and keeps the money that came in.
// Known layouts: Wise (classic statement and transaction history), Payoneer, Upwork. Anything else is read by
// column names (date, amount, currency…), in English or Portuguese. Descriptions are only shown in the
// preview to help pick the client; they're never sent to the server (time and money only).
// No imports, so `npm test` runs it directly with Node.

export type StatementFormat = "wise" | "wise_history" | "upwork" | "payoneer" | "generic";
export type StatementRow = { day: string; amount: number; currency: string; description: string; ref: string };
export type StatementResult = { format: StatementFormat; rows: StatementRow[]; skipped: number };

const SUPPORTED = new Set(["USD", "EUR", "GBP", "BRL"]);

// CSV with quotes; the delimiter (comma, semicolon or tab) is guessed from the header line.
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, "");
  const firstLine = clean.slice(0, clean.indexOf("\n") === -1 ? undefined : clean.indexOf("\n"));
  const delimiter = [",", ";", "\t"].reduce((best, d) => (firstLine.split(d).length > firstLine.split(best).length ? d : best), ",");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && clean[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

const norm = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

// "1,234.56", "1.234,56", "$1,234.56", "-12.50", "(12.50)", "USD 3000" → number
export function parseAmount(raw: string): number | null {
  let s = raw.trim();
  if (!s) return null;
  const negative = /^\(.*\)$/.test(s) || s.includes("-");
  s = s.replace(/[^\d.,]/g, "");
  if (!s) return null;
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  if (lastDot >= 0 && lastComma >= 0) {
    const decimal = lastDot > lastComma ? "." : ",";
    s = s.split(decimal === "." ? "," : ".").join("").replace(",", ".");
  } else if (lastComma >= 0) {
    // One comma not followed by exactly three digits is a decimal comma ("1234,5", "1234,56"); "1,234" is thousands.
    s = s.split(",").length === 2 && !/,\d{3}$/.test(s) ? s.replace(",", ".") : s.replace(/,/g, "");
  } else if (lastDot >= 0 && s.split(".").length > 2) {
    s = s.replace(/\./g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? (negative ? -n : n) : null;
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, fev: 2, mar: 3, apr: 4, abr: 4, may: 5, mai: 5, jun: 6, jul: 7,
  aug: 8, ago: 8, sep: 9, set: 9, oct: 10, out: 10, nov: 11, dec: 12, dez: 12,
};
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => {
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? `${y}-${pad(m)}-${pad(d)}` : null;
};

// Day/month order for numeric dates like 03/10/2026, decided from all the values in the file.
export function detectDayFirst(values: string[], fallbackDayFirst: boolean): boolean {
  for (const v of values) {
    const m = /^(\d{1,2})[/.-](\d{1,2})[/.-]\d{4}/.exec(v.trim());
    if (!m) continue;
    if (Number(m[1]) > 12) return true;
    if (Number(m[2]) > 12) return false;
  }
  return fallbackDayFirst;
}

// "2026-10-27", "2026-10-27 14:03:22", "27-10-2026", "27/10/2026", "10/27/2026", "Oct 27, 2026", "27 Oct 2026"
export function parseDate(raw: string, dayFirst: boolean): string | null {
  const s = raw.trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/.exec(s);
  if (m) return dayFirst ? iso(+m[3], +m[2], +m[1]) : iso(+m[3], +m[1], +m[2]);
  m = /^([a-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/i.exec(s);
  if (m && MONTHS[m[1].toLowerCase()]) return iso(+m[3], MONTHS[m[1].toLowerCase()], +m[2]);
  m = /^(\d{1,2})\s+(?:de\s+)?([a-z]{3})[a-z]*\.?\s+(?:de\s+)?(\d{4})/i.exec(s);
  if (m && MONTHS[m[2].toLowerCase()]) return iso(+m[3], MONTHS[m[2].toLowerCase()], +m[1]);
  return null;
}

function detectFormat(headers: string[]): StatementFormat {
  const h = new Set(headers);
  if (h.has("direction") && headers.some((x) => x.startsWith("target amount"))) return "wise_history";
  if (h.has("transferwise id") || (h.has("payment reference") && h.has("running balance"))) return "wise";
  if (h.has("transaction id") && h.has("type") && (h.has("agency") || h.has("freelancer") || h.has("team"))) return "upwork";
  if (headers.some((x) => x.includes("payoneer"))) return "payoneer";
  return "generic";
}

const find = (headers: string[], patterns: RegExp[]) => {
  for (const p of patterns) {
    const i = headers.findIndex((x) => p.test(x));
    if (i >= 0) return i;
  }
  return -1;
};

// Short stable hash for rows without an ID column, so re-importing the same file is detected.
function hash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

const OUTGOING = /withdraw|saque|retirada|transfer to|transferencia para|sent money|conversion|converted|convert|fee|tarifa|taxa|card|cartao|refund to/i;

export function readStatement(text: string): StatementResult {
  const table = parseCsv(text);
  if (table.length < 2) return { format: "generic", rows: [], skipped: 0 };
  const headers = table[0].map(norm);
  const format = detectFormat(headers);

  const col = {
    date:
      format === "wise_history"
        ? find(headers, [/^finished on/, /^created on/])
        : find(headers, [/^date$/, /^data$/, /^transaction date/, /^data da transac/, /^date/, /^data/]),
    amount:
      format === "wise_history"
        ? find(headers, [/^target amount/])
        : find(headers, [/^amount$/, /^valor$/, /^montante$/, /^credit/, /^credito/, /^amount/, /^valor/]),
    currency:
      format === "wise_history" ? find(headers, [/^target currency/]) : find(headers, [/^currency$/, /^moeda$/, /^currency/, /^moeda/]),
    description: find(headers, [/^description/, /^descricao/, /^details/, /^payer name/, /^source name/, /^type$/]),
    id: find(headers, [/^transferwise id$/, /^transaction id$/, /^id$/, /^payment reference$/]),
    type: format === "upwork" ? find(headers, [/^type$/]) : -1,
    direction: format === "wise_history" ? find(headers, [/^direction$/]) : -1,
    status: find(headers, [/^status$/]),
  };
  if (col.date < 0 || col.amount < 0) return { format, rows: [], skipped: table.length - 1 };

  const body = table.slice(1);
  const dayFirst = detectDayFirst(body.map((r) => r[col.date] ?? ""), format !== "payoneer");
  const rows: StatementRow[] = [];
  let skipped = 0;
  for (const r of body) {
    const get = (i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
    const amount = parseAmount(get(col.amount));
    const day = parseDate(get(col.date), dayFirst);
    const currency = (get(col.currency) || "USD").toUpperCase();
    const description = get(col.description) || get(col.type);
    const status = norm(get(col.status));
    const incoming =
      amount !== null &&
      amount > 0 &&
      !/cancel|fail|refund|pending|declin/.test(status) &&
      (format === "wise_history"
        ? get(col.direction).toUpperCase() === "IN"
        : format === "upwork"
          ? /hourly|fixed|bonus|milestone|payment/i.test(get(col.type))
          : !OUTGOING.test(description));
    if (!incoming || !day || !SUPPORTED.has(currency)) {
      skipped++;
      continue;
    }
    const id = get(col.id);
    rows.push({
      day,
      amount: Math.round(amount * 100) / 100,
      currency,
      description,
      ref: `${format}:${id || `${day}:${amount}:${currency}:${hash(description)}`}`.slice(0, 120),
    });
  }
  return { format, rows, skipped };
}
