// Converting payments to reais with Banco Central PTAX rates (stored in the ptax_rates table).
// No imports, so `npm test` runs it directly with Node.

export type RateCurrency = "USD" | "EUR" | "GBP";
export type RateRow = { day: string; buy: number; parity: number }; // parity: US$ per unit (1 for USD)
export type RateBook = Partial<Record<RateCurrency, RateRow[]>>; // each list sorted by day, oldest first

const isRateCurrency = (c: string): c is RateCurrency => c === "USD" || c === "EUR" || c === "GBP";

// The rate of the last business day on or before a day ("2026-10-27"). Rates exist only for business days.
export function rateOnOrBefore(rows: RateRow[] | undefined, day: string): RateRow | null {
  if (!rows) return null;
  let found: RateRow | null = null;
  for (const row of rows) {
    if (row.day > day) break;
    found = row;
  }
  return found;
}

// The dollar rate the carnê-leão uses for income received in a month: the buying rate of the last business
// day of the first half of the previous month (IN SRF 208/2002). month is 1–12.
export function carneLeaoRate(book: RateBook, year: number, month: number): RateRow | null {
  const prev = new Date(Date.UTC(year, month - 2, 1));
  const prefix = prev.toISOString().slice(0, 8); // "2026-09-"
  const row = rateOnOrBefore(book.USD, `${prefix}15`);
  return row && row.day.startsWith(prefix) ? row : null;
}

// Income in reais for tax. Dollars convert at the carnê-leão rate; other currencies first convert to dollars
// at the parity of the day received, then to reais at the same rate. null when a rate is missing.
export function toTaxBrl(book: RateBook, amount: number, currency: string, receivedOn: string): number | null {
  if (currency === "BRL") return amount;
  if (!isRateCurrency(currency)) return null;
  const [year, month] = receivedOn.split("-").map(Number);
  const rule = carneLeaoRate(book, year, month);
  if (!rule) return null;
  if (currency === "USD") return amount * rule.buy;
  const parity = rateOnOrBefore(book[currency], receivedOn);
  return parity ? amount * parity.parity * rule.buy : null;
}

// What the amount was worth in reais on the day received, at the PTAX buying rate: the reference for what
// fees and the exchange spread took. null when the rate is missing.
export function toMarketBrl(book: RateBook, amount: number, currency: string, receivedOn: string): number | null {
  if (currency === "BRL") return amount;
  if (!isRateCurrency(currency)) return null;
  const row = rateOnOrBefore(book[currency], receivedOn);
  return row ? amount * row.buy : null;
}
