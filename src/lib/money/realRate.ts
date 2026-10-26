// Real hourly rate (feature 2): money ÷ every hour worked, paid or not.
// Until payments are logged (the next build step), the money is estimated from the rate each
// platform advertises, so the gap shown comes from unpaid time and commission.
// No imports, so `npm test` runs this directly with Node.

export type RateSource = {
  pay_model: "hourly" | "per_task" | "fixed";
  rate: number | null;
  commission_pct: number | null;
};

export type RateEntry = {
  kind: "paid" | "unpaid";
  started_at: string;
  ended_at: string | null;
  units: number | null;
};

export type RateSummary = {
  paidHours: number;
  unpaidHours: number;
  hours: number;
  units: number;
  // In the source's currency. null when it can't be estimated yet (see `missing`).
  earned: number | null;
  // earned ÷ all hours. This is the number Ganhômetro is about.
  realRate: number | null;
  // earned ÷ paid hours only, what the work "looks like" it pays.
  paidRate: number | null;
  unpaidShare: number | null;
  // How far the real rate is below the advertised hourly rate: 0.43 = 43% less. Hourly pay only.
  gap: number | null;
  missing: "units" | "fixed" | null;
};

const HOUR = 3_600_000;

// Hours of an entry inside [from, now]. A running entry (no end) counts up to now.
export function entryHours(entry: Pick<RateEntry, "started_at" | "ended_at">, now: number, from = -Infinity): number {
  const start = Math.max(Date.parse(entry.started_at), from);
  const end = Math.min(entry.ended_at ? Date.parse(entry.ended_at) : now, now);
  return Math.max(0, end - start) / HOUR;
}

export function summarize(source: RateSource, entries: RateEntry[], now: number, from = -Infinity): RateSummary {
  let paidHours = 0;
  let unpaidHours = 0;
  let units = 0;
  for (const e of entries) {
    const h = entryHours(e, now, from);
    if (e.kind === "paid") {
      paidHours += h;
      units += e.units ?? 0;
    } else {
      unpaidHours += h;
    }
  }
  const hours = paidHours + unpaidHours;
  const keep = 1 - (source.commission_pct ?? 0) / 100;

  let earned: number | null = null;
  let missing: RateSummary["missing"] = null;
  if (source.pay_model === "fixed" || source.rate === null) {
    missing = "fixed";
  } else if (source.pay_model === "hourly") {
    earned = paidHours * source.rate * keep;
  } else if (units > 0 || paidHours === 0) {
    earned = units * source.rate * keep;
  } else {
    missing = "units";
  }

  const realRate = earned !== null && hours > 0 ? earned / hours : null;
  return {
    paidHours,
    unpaidHours,
    hours,
    units,
    earned,
    realRate,
    paidRate: earned !== null && paidHours > 0 ? earned / paidHours : null,
    unpaidShare: hours > 0 ? unpaidHours / hours : null,
    gap: source.pay_model === "hourly" && source.rate && realRate !== null ? 1 - realRate / source.rate : null,
    missing,
  };
}
