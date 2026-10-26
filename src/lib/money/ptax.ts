// Latest PTAX buying rate from the Banco Central (Olinda API), the rate the carnê-leão uses.
// Interim for the dashboard: from the payments step on, a daily job stores rates in a ptax_rates
// table and conversions use each payment's own date.
import { cacheLife } from "next/cache";

const API = "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata";

export type Ptax = { rate: number; date: string };

// "MM-DD-YYYY", the date format the API expects.
const apiDate = (d: Date) =>
  `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}-${d.getUTCFullYear()}`;

async function fetchLatest(currency: "USD" | "EUR" | "GBP"): Promise<Ptax> {
  "use cache";
  cacheLife("hours");
  const end = new Date();
  // Ten days back covers weekends and bank holidays.
  const range = `@dataInicial='${apiDate(new Date(end.getTime() - 10 * 86_400_000))}'&@dataFinalCotacao='${apiDate(end)}'`;
  const query = "$format=json&$orderby=dataHoraCotacao desc&$top=1";
  const url =
    currency === "USD"
      ? `${API}/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?${range}&${query}`
      : `${API}/CotacaoMoedaPeriodo(moeda=@moeda,dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)` +
        `?@moeda='${currency}'&${range}&$filter=tipoBoletim eq 'Fechamento'&${query}`;
  const res = await fetch(encodeURI(url), { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error(`PTAX ${currency}: HTTP ${res.status}`);
  const row = (await res.json()).value?.[0];
  if (!row?.cotacaoCompra) throw new Error(`PTAX ${currency}: no quote`);
  return { rate: Number(row.cotacaoCompra), date: String(row.dataHoraCotacao).slice(0, 10) };
}

// The dollar rate the carnê-leão uses for income received in a month: the PTAX buying rate of the last
// business day of the first half of the previous month (IN SRF 208/2002). month is 1–12.
async function fetchCarneLeaoRate(year: number, month: number): Promise<Ptax> {
  "use cache";
  cacheLife("days");
  const prev = new Date(Date.UTC(year, month - 2, 1));
  const range = `@dataInicial='${apiDate(prev)}'&@dataFinalCotacao='${apiDate(new Date(prev.getTime() + 14 * 86_400_000))}'`;
  const url = `${API}/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?${range}&$format=json&$orderby=dataHoraCotacao desc&$top=1`;
  const res = await fetch(encodeURI(url), { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error(`PTAX carnê-leão: HTTP ${res.status}`);
  const row = (await res.json()).value?.[0];
  if (!row?.cotacaoCompra) throw new Error("PTAX carnê-leão: no quote");
  return { rate: Number(row.cotacaoCompra), date: String(row.dataHoraCotacao).slice(0, 10) };
}

export async function carneLeaoRate(year: number, month: number): Promise<Ptax | null> {
  try {
    return await fetchCarneLeaoRate(year, month);
  } catch {
    return null;
  }
}

// Today's rate for each foreign currency the app supports; currencies the Banco Central didn't answer for are left out.
export async function latestRates(): Promise<Partial<Record<"USD" | "EUR" | "GBP", Ptax>>> {
  const entries = await Promise.all((["USD", "EUR", "GBP"] as const).map(async (c) => [c, await latestPtax(c)] as const));
  return Object.fromEntries(entries.filter(([, p]) => p));
}

// The current year and month in Brazil, for pages that are otherwise static (refreshed hourly).
export async function brazilMonth(): Promise<{ year: number; month: number }> {
  "use cache";
  cacheLife("hours");
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "numeric" }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month") };
}

// null when the Banco Central can't be reached: the dashboard then shows the original currency only.
// A failed fetch throws inside the cached function, so the failure isn't cached.
export async function latestPtax(currency: string): Promise<Ptax | null> {
  if (currency === "BRL") return { rate: 1, date: "" };
  if (currency !== "USD" && currency !== "EUR" && currency !== "GBP") return null;
  try {
    return await fetchLatest(currency);
  } catch {
    return null;
  }
}
