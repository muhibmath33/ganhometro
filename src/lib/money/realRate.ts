// Real hourly rate (feature 2): money ÷ every hour worked, paid or not.
// This is the estimate from the advertised rate, used when no payment covers the period (received.ts
// has the version from money received), and for projects with their own pay.
// No imports, so `npm test` runs this directly with Node.

export type RateSource = {
  pay_model: "hourly" | "per_task" | "fixed" | "retainer"; // retainer: rate is the monthly amount
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
const AVERAGE_MONTH_MS = 30.4375 * 24 * HOUR;

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
  } else if (source.pay_model === "retainer") {
    // The monthly amount, for the share of a month the period lasts.
    if (Number.isFinite(from)) earned = source.rate * keep * Math.max(0, now - from) / AVERAGE_MONTH_MS;
    else missing = "fixed";
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

export type RateProject = {
  id: string;
  pay_model: "hourly" | "fixed" | null; // null: same pay as the client
  rate: number | null;
  fixed_price: number | null;
  lifetimeHours: number; // every hour logged on it so far, for fixed prices
};

type ProjectEntry = RateEntry & { project_id: string | null };

// A source whose entries may belong to projects with their own pay: an hourly project earns its own rate;
// a fixed-price project earns its price spread over every hour it has taken so far.
export function summarizeSource(source: RateSource, projects: RateProject[], entries: ProjectEntry[], now: number, from = -Infinity): RateSummary {
  if (source.pay_model === "retainer" || !projects.length) return summarize(source, entries, now, from);
  const keep = 1 - (source.commission_pct ?? 0) / 100;
  const groups = new Map<string | null, ProjectEntry[]>();
  for (const e of entries) {
    const key = projects.some((p) => p.id === e.project_id) ? e.project_id : null;
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }
  const parts: RateSummary[] = [];
  for (const [key, list] of groups) {
    const project = projects.find((p) => p.id === key);
    if (!project || project.pay_model === null) parts.push(summarize(source, list, now, from));
    else if (project.pay_model === "hourly") parts.push(summarize({ ...source, pay_model: "hourly", rate: project.rate }, list, now, from));
    else {
      const part = summarize({ ...source, pay_model: "fixed", rate: null }, list, now, from);
      const earned = project.fixed_price !== null && project.lifetimeHours > 0 ? project.fixed_price * keep * (part.hours / project.lifetimeHours) : null;
      parts.push({ ...part, earned, missing: earned === null ? "fixed" : null });
    }
  }
  const paidHours = parts.reduce((sum, p) => sum + p.paidHours, 0);
  const unpaidHours = parts.reduce((sum, p) => sum + p.unpaidHours, 0);
  const hours = paidHours + unpaidHours;
  const unknown = parts.find((p) => p.earned === null && p.hours > 0);
  // Hours on projects with their own pay make a comparison with the client's advertised rate meaningless.
  const ownPay = [...groups.keys()].some((key) => projects.find((p) => p.id === key)?.pay_model);
  const earned = unknown ? null : parts.reduce((sum, p) => sum + (p.earned ?? 0), 0);
  const realRate = earned !== null && hours > 0 ? earned / hours : null;
  return {
    paidHours,
    unpaidHours,
    hours,
    units: parts.reduce((sum, p) => sum + p.units, 0),
    earned,
    realRate,
    paidRate: earned !== null && paidHours > 0 ? earned / paidHours : null,
    unpaidShare: hours > 0 ? unpaidHours / hours : null,
    gap: !ownPay && source.pay_model === "hourly" && source.rate && realRate !== null ? 1 - realRate / source.rate : null,
    missing: unknown?.missing ?? null,
  };
}

// One project's real rate. A fixed price is spread over every hour so far (allEntries), using what was received
// for it when there's a payment, or the price; other projects use the period's entries and their own rate.
export function projectRate(
  source: RateSource,
  project: RateProject,
  { periodEntries, allEntries, received, now, from }: { periodEntries: RateEntry[]; allEntries: RateEntry[]; received: number; now: number; from: number },
): { hours: number; realRate: number | null; basis: "received" | "price" | "rate" } {
  const keep = 1 - (source.commission_pct ?? 0) / 100;
  if (project.pay_model === "fixed") {
    const hours = allEntries.reduce((sum, e) => sum + entryHours(e, now), 0);
    const money = received > 0 ? received : (project.fixed_price ?? 0);
    return { hours, realRate: hours > 0 ? (money * keep) / hours : null, basis: received > 0 ? "received" : "price" };
  }
  const rateSource = project.pay_model === "hourly" ? { ...source, pay_model: "hourly" as const, rate: project.rate } : source;
  const s = summarize(rateSource, periodEntries, now, from);
  return { hours: s.hours, realRate: s.realRate, basis: "rate" };
}
