// Loads PTAX rates for converting payments, from the ptax_rates table. The daily job keeps the table up to
// date; anything missing for the requested range is fetched from the Banco Central and stored on the spot.
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays } from "@/lib/app/time";
import type { Database } from "@/lib/supabase/database.types";
import { adminClient } from "@/lib/supabase/admin";
import type { RateBook, RateCurrency } from "./convert";
import { fetchPtaxRange, type PtaxRow } from "./ptax";

// Weekends plus a long holiday (Carnaval) never leave more than this many days without a rate.
const MAX_GAP_DAYS = 6;

export async function loadRates(
  supabase: SupabaseClient<Database>,
  currencies: string[],
  from: string,
  to: string,
): Promise<RateBook> {
  const wanted = [...new Set(currencies)].filter((c): c is RateCurrency => c === "USD" || c === "EUR" || c === "GBP");
  // The carnê-leão rule needs the dollar rate of the previous month's first half; euros and pounds also need
  // the dollar rate.
  if (wanted.length && !wanted.includes("USD")) wanted.push("USD");
  if (!wanted.length) return {};
  const start = `${addDays(`${from.slice(0, 8)}01`, -1).slice(0, 8)}01`;
  const today = new Date().toISOString().slice(0, 10);
  const end = to < today ? to : today;

  const { data } = await supabase
    .from("ptax_rates")
    .select("currency, day, buy, usd_parity")
    .in("currency", wanted)
    .gte("day", start)
    .lte("day", end)
    .order("day");
  const book: RateBook = {};
  for (const row of data ?? []) {
    const c = row.currency as RateCurrency;
    (book[c] ??= []).push({ day: row.day, buy: Number(row.buy), parity: Number(row.usd_parity) });
  }

  const stale = wanted.filter((c) => {
    const rows = book[c];
    return !rows?.length || rows[0].day > addDays(start, MAX_GAP_DAYS) || rows[rows.length - 1].day < addDays(end, -MAX_GAP_DAYS);
  });
  if (stale.length) {
    const fetched: PtaxRow[] = (await Promise.all(stale.map((c) => fetchPtaxRange(c, start, end).catch(() => [])))).flat();
    if (fetched.length) {
      await adminClient()?.from("ptax_rates").upsert(fetched, { onConflict: "currency,day" });
      for (const c of stale) {
        const rows = fetched.filter((r) => r.currency === c).map((r) => ({ day: r.day, buy: r.buy, parity: r.usd_parity }));
        if (rows.length) book[c] = rows.sort((a, b) => a.day.localeCompare(b.day));
      }
    }
  }
  return book;
}
