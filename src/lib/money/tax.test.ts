import assert from "node:assert/strict";
import { test } from "node:test";
import {
  companyBreakEven,
  companyMonth,
  darfDueDate,
  individualMonth,
  inssSelfEmployed,
  monthlyIncomeTax,
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
