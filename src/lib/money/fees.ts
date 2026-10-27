// Exchange and fee audit (Stage 1, sprint 8): what each way of receiving money really cost, from the person's
// own payments. Cost = the payment in reais at the day's PTAX, minus the platform's commission, minus what
// reached the Brazilian account. It covers the spread, transfer fees and IOF together.
// No imports, so `npm test` runs it directly with Node.

export type FeeInput = {
  method: string | null; // "wise", "payoneer"… null when the person didn't say
  marketBrl: number | null; // the payment in reais at the day's PTAX
  arrivedBrl: number | null; // what reached the account, when the person entered it
  commissionPct: number;
};

export type ProviderCost = {
  method: string; // "unknown" when no method was given
  payments: number; // all payments through it
  counted: number; // those with both values known
  expected: number; // what would have arrived at PTAX, after commission
  arrived: number;
  cost: number; // expected − arrived; negative when the rate moved in the person's favour
  pct: number | null; // cost ÷ expected
};

// A provider needs this many counted payments before it's compared with the others.
const MIN_FOR_COMPARISON = 2;

function sum(method: string, rows: FeeInput[]): ProviderCost {
  const known = rows.filter((r) => r.marketBrl !== null && r.arrivedBrl !== null);
  const expected = known.reduce((s, r) => s + r.marketBrl! * (1 - r.commissionPct / 100), 0);
  const arrived = known.reduce((s, r) => s + r.arrivedBrl!, 0);
  return { method, payments: rows.length, counted: known.length, expected, arrived, cost: expected - arrived, pct: expected > 0 ? (expected - arrived) / expected : null };
}

export function feeAudit(rows: FeeInput[]) {
  const byMethod = new Map<string, FeeInput[]>();
  for (const r of rows) {
    const key = r.method ?? "unknown";
    byMethod.set(key, [...(byMethod.get(key) ?? []), r]);
  }
  const providers = [...byMethod].map(([method, list]) => sum(method, list)).sort((a, b) => b.cost - a.cost);
  const total = sum("total", rows);

  // What switching would have saved: every provider's payments at the cheapest provider's rate. Only known
  // providers with enough payments take part, and only when there are at least two of them.
  const comparable = providers.filter((p) => p.method !== "unknown" && p.counted >= MIN_FOR_COMPARISON && p.pct !== null);
  let savings: { best: string; bestPct: number; amount: number } | null = null;
  if (comparable.length >= 2) {
    const best = comparable.reduce((a, b) => (b.pct! < a.pct! ? b : a));
    const amount = comparable.filter((p) => p !== best).reduce((s, p) => s + Math.max(0, p.pct! - best.pct!) * p.expected, 0);
    if (amount >= 1) savings = { best: best.method, bestPct: best.pct!, amount };
  }
  return { providers, total, uncounted: total.payments - total.counted, savings };
}
