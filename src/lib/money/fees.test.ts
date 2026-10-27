import assert from "node:assert/strict";
import { test } from "node:test";
import { feeAudit } from "./fees.ts";

const close = (a: number | null | undefined, b: number) => assert.ok(a !== null && a !== undefined && Math.abs(a - b) < 1e-6, `${a} ≈ ${b}`);

test("cost per provider: PTAX value after commission, minus what arrived", () => {
  const audit = feeAudit([
    { method: "wise", marketBrl: 5000, arrivedBrl: 4950, commissionPct: 0 }, // 1%
    { method: "wise", marketBrl: 5000, arrivedBrl: 4950, commissionPct: 0 },
    { method: "paypal", marketBrl: 5000, arrivedBrl: 4600, commissionPct: 0 }, // 8%
    { method: "paypal", marketBrl: 2500, arrivedBrl: 2300, commissionPct: 0 },
    { method: "payoneer", marketBrl: 5000, arrivedBrl: 3900, commissionPct: 20 }, // 4.000 expected after 20% → 2,5%
    { method: null, marketBrl: 1000, arrivedBrl: null, commissionPct: 0 }, // not counted
  ]);
  const paypal = audit.providers.find((p) => p.method === "paypal")!;
  close(paypal.expected, 7500);
  close(paypal.cost, 600);
  close(paypal.pct, 0.08);
  const payoneer = audit.providers.find((p) => p.method === "payoneer")!;
  close(payoneer.cost, 100);
  close(payoneer.pct, 0.025);
  assert.equal(audit.providers[0].method, "paypal"); // most expensive first
  assert.equal(audit.uncounted, 1);
  close(audit.total.cost, 100 + 600 + 100);
  // Payoneer has a single payment, so it isn't compared. PayPal at Wise's 1%: 7.500 × 7% = 525.
  assert.equal(audit.savings?.best, "wise");
  close(audit.savings?.amount, 525);
});

test("no savings with one provider, or when the rate moved in the person's favour", () => {
  assert.equal(feeAudit([{ method: "wise", marketBrl: 100, arrivedBrl: 99, commissionPct: 0 }, { method: "wise", marketBrl: 100, arrivedBrl: 99, commissionPct: 0 }]).savings, null);
  const gain = feeAudit([{ method: "wise", marketBrl: 100, arrivedBrl: 101, commissionPct: 0 }]);
  close(gain.total.cost, -1);
});
