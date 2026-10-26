import assert from "node:assert/strict";
import { test } from "node:test";
import {
  carneLeaoYear,
  companyBreakEven,
  companyMonth,
  companyMonthAt,
  compareMonths,
  darfDueDate,
  dueStatus,
  individualMonth,
  inssSelfEmployed,
  monthlyIncomeTax,
  nextMonthDueDate,
  rbt12At,
  simplesExportRate,
} from "./tax.ts";

const close = (a: number | undefined, b: number, tol = 0.005) => assert.ok(a !== undefined && Math.abs(a - b) < tol, `${a} ≈ ${b}`);

test("carnê-leão 2026 matches the spreadsheet's verified cases", () => {
  // gross (R$) → tax due, from bonus/verify_carne_leao.py
  for (const [gross, expected] of [
    [5000, 0],
    [6000, 394.54],
    [7350, 945.54],
    [8000, 1124.29],
    [2000, 0],
  ]) {
    close(monthlyIncomeTax(gross).due, expected);
  }
});

test("legal deductions replace the simplified discount when larger", () => {
  // 16.500 − INSS 1.695,11 = 14.804,89 × 27,5% − 908,73
  close(monthlyIncomeTax(16500, 1695.11).due, 3162.61);
  close(monthlyIncomeTax(16500, 100).deduction, 607.2);
});

test("INSS for the self-employed", () => {
  close(inssSelfEmployed(16500, "full"), 1695.11); // capped at the ceiling
  close(inssSelfEmployed(5000, "full"), 1000);
  close(inssSelfEmployed(1000, "full"), 324.2); // at least on the minimum wage
  close(inssSelfEmployed(16500, "simplified"), 178.31);
  assert.equal(inssSelfEmployed(16500, "none"), 0);
});

test("Simples Nacional on export revenue (Anexo III)", () => {
  close(simplesExportRate(180_000)?.exportRate, 0.06 * 0.509, 1e-9);
  close(simplesExportRate(300_000)?.effective, 0.0808, 1e-9); // (300k × 11,2% − 9.360) ÷ 300k
  assert.equal(simplesExportRate(5_000_000), null);
});

test("Ana: US$ 3.000 at R$ 5,50, individual vs. company (docs/freelancer-market.md §2.1)", () => {
  const pf = individualMonth(16500, { inss: "full" });
  close(pf.inss, 1695.11);
  close(pf.tax, 3162.61);
  close(pf.net, 11642.28);
  const pj = companyMonth(16500)!;
  close(pj.das, 543.61); // R$ 198k a year is the 2nd band: (198k × 11,2% − 9.360) ÷ 198k × 50,9%
  close(pj.proLabore, 4620);
  close(pj.inss, 508.2);
  assert.equal(pj.irrf, 0); // pro-labore under R$ 5.000: zero under Lei 15.270
  close(pj.net, 15198.19);
});

test("break-even: a company pays off from about R$ 6.700 if the individual skips INSS", () => {
  assert.equal(companyBreakEven({ inss: "none" }), 6700);
  assert.ok((companyBreakEven({ inss: "full" }) ?? Infinity) <= 3000);
});

test("DARF due dates skip weekends and bank holidays", () => {
  assert.equal(darfDueDate(2026, 10), "2026-11-30"); // received in October → last business day of November
  assert.equal(darfDueDate(2026, 11), "2026-12-30"); // 31/12 has no bank service
  assert.equal(darfDueDate(2026, 1), "2026-02-27");
});

test("a year of carnê-leão matches the spreadsheet model, including the R$ 10 carry", () => {
  // [month, gross R$, legal deductions, month tax, carry in, DARF, due] from bonus/build_carne_leao.py with its
  // test payments (bonus/verify_carne_leao.py).
  const expected: [number, number, number, number, number, number, string][] = [
    [1, 2588.3, 0, 0, 0, 0, "2026-02-27"],
    [2, 4845.6, 0, 0, 0, 0, "2026-03-31"],
    [3, 6012.43, 0, 399.61, 0, 399.61, "2026-04-30"],
    [4, 7880.25, 0, 1091.36, 0, 1091.36, "2026-05-29"],
    [5, 14976.6, 0, 3042.86, 0, 3042.86, "2026-06-30"],
    [6, 5010.1, 0, 3.61, 0, 0, "2026-07-31"],
    [7, 0, 0, 0, 3.61, 0, "2026-08-31"],
    [8, 5040.15, 0, 14.37, 3.61, 17.98, "2026-09-30"],
    [9, 7834.5, 1379.18, 866.48, 0, 866.48, "2026-10-30"],
    [10, 3863.87, 0, 0, 0, 0, "2026-11-30"],
    [11, 10103.0, 300, 1702.62, 0, 1702.62, "2026-12-30"],
    [12, 0, 0, 0, 0, 0, "2027-01-29"],
  ];
  const year = carneLeaoYear(2026, expected.map(([, gross, legal]) => ({ gross, legal })));
  expected.forEach(([m, , , monthTax, carry, darf, due], i) => {
    close(year[i].monthTax, monthTax);
    close(year[i].carry, carry);
    close(year[i].darf, darf);
    assert.equal(year[i].due, due, `month ${m}`);
  });
});

test("RBT12: the 12 months before, or the average so far × 12 for a young company", () => {
  const revenues = Array.from({ length: 14 }, (_, i) => 10000 + i * 1000);
  assert.equal(rbt12At(revenues, 0), 120000); // first month: itself × 12
  assert.equal(rbt12At(revenues, 2), ((10000 + 11000) / 2) * 12);
  assert.equal(rbt12At(revenues, 13), revenues.slice(1, 13).reduce((a, b) => a + b, 0));
});

test("company month with a real RBT12 vs. the one-month estimate", () => {
  // R$ 16.500 in a month after a year at R$ 10.000/month: RBT12 R$ 120k, first band.
  close(companyMonthAt(16500, 120000)!.das, 16500 * 0.06 * 0.509);
  close(companyMonth(16500)!.das, companyMonthAt(16500, 198000)!.das);
});

test("comparing a year both ways", () => {
  const year = Array(12).fill(16500);
  const c = compareMonths(year, { inss: "full", accountant: 250 });
  close(c.individual, 12 * (1695.11 + 3162.61));
  assert.ok(c.savings > 40000 && c.savings < 45000, String(c.savings));
  const low = compareMonths(Array(12).fill(3000), { inss: "none" });
  assert.ok(low.savings < 0, "at R$ 3.000 without INSS, staying an individual is cheaper");
});

test("DAS and INSS due dates move to the next business day", () => {
  assert.equal(nextMonthDueDate(2026, 10, 20), "2026-11-23"); // 20/11 is Consciência Negra, then a weekend
  assert.equal(nextMonthDueDate(2026, 9, 20), "2026-10-20");
  assert.equal(nextMonthDueDate(2026, 2, 15), "2026-03-16"); // 15/03/2026 is a Sunday
});

test("reminder status", () => {
  assert.equal(dueStatus(0, "2026-11-30", "2026-11-28", null), "none");
  assert.equal(dueStatus(100, "2026-11-30", "2026-11-28", null), "soon");
  assert.equal(dueStatus(100, "2026-11-30", "2026-11-10", null), "upcoming");
  assert.equal(dueStatus(100, "2026-11-30", "2026-12-01", null), "overdue");
  assert.equal(dueStatus(100, "2026-11-30", "2026-12-01", "2026-11-29"), "paid");
});
