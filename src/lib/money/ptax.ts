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
