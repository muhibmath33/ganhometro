// Brazilian tax and social security for people paid from abroad, 2026 rules.
// Always shown as an estimate ("estimativa"); to be reviewed by an accountant before launch.
// The income tax part matches the carnê-leão spreadsheet (bonus/build_carne_leao.py) and its test cases.
// No imports, so `npm test` runs it directly with Node.

export const RULES_2026 = {
  // Monthly progressive table: base above (R$), rate, amount to deduct.
  brackets: [
    [0, 0, 0],
    [2428.8, 0.075, 182.16],
    [2826.65, 0.15, 394.16],
    [3751.05, 0.225, 675.49],
    [4664.68, 0.275, 908.73],
  ],
  simplified: 607.2, // simplified monthly discount, used when larger than the legal deductions
  perDependent: 189.59,
  // Lei 15.270/2025: no tax up to R$ 5.000 a month, a partial reduction up to R$ 7.350.
  exemptUpTo: 5000,
  reductionMax: 312.89,
  partialUpTo: 7350,
  partialK: 978.62,
  partialF: 0.133145,
  darfMin: 10, // a DARF under R$ 10 is carried to the next month
  minimumWage: 1621, // Decreto 12.797/2025
  inssCeiling: 8475.55,
  inssFullRate: 0.2, // self-employed (contribuinte individual), normal plan
  inssSimplifiedRate: 0.11, // simplified plan, on the minimum wage (no retirement by contribution time)
  inssProLaboreRate: 0.11,
  fatorR: 0.28, // pro-labore share of revenue that keeps a service company in Simples Nacional Anexo III
};

// Simples Nacional Anexo III: annual revenue up to, nominal rate, amount to deduct, and the share of the tax
// still due on export revenue (IRPJ + CSLL + CPP; ISS, PIS and Cofins don't apply to service exports).
const ANEXO_III: [number, number, number, number][] = [
  [180_000, 0.06, 0, 0.509],
  [360_000, 0.112, 9_360, 0.509],
  [720_000, 0.135, 17_640, 0.509],
  [1_800_000, 0.16, 35_640, 0.509],
  [3_600_000, 0.21, 125_640, 0.509],
  [4_800_000, 0.33, 648_000, 0.805],
];

// Days without bank service, for DARF due dates.
const HOLIDAYS = new Set([
  "2026-01-01", "2026-02-16", "2026-02-17", "2026-04-03", "2026-04-21", "2026-05-01", "2026-06-04",
  "2026-09-07", "2026-10-12", "2026-11-02", "2026-11-15", "2026-11-20", "2026-12-25", "2026-12-31",
  "2027-01-01", "2027-02-08", "2027-02-09", "2027-03-26", "2027-04-21", "2027-05-01", "2027-05-27",
  "2027-09-07", "2027-10-12", "2027-11-02", "2027-11-15", "2027-11-20", "2027-12-25", "2027-12-31",
]);

// Excel-style ROUND(x, 2), like the spreadsheet: 15 significant digits, then half away from zero.
export function round2(x: number): number {
  const scaled = Number((Math.abs(x) * 100).toPrecision(15));
  return (Math.sign(x) * Math.round(scaled)) / 100;
}

export function tableTax(base: number): number {
  const [, rate, deduct] = [...RULES_2026.brackets].reverse().find(([low]) => base >= low) ?? [0, 0, 0];
  return Math.max(0, round2(base * rate - deduct));
}

export function taxReduction(gross: number, tax: number): number {
  const r = RULES_2026;
  if (gross <= 0) return 0;
  if (gross <= r.exemptUpTo) return Math.min(tax, r.reductionMax);
  if (gross <= r.partialUpTo) return Math.min(tax, Math.max(0, round2(r.partialK - r.partialF * gross)));
  return 0;
}

// Monthly income tax with the 2026 table: carnê-leão (income from abroad, no withholding) and the IRRF on a
// pro-labore follow the same rules. legalDeductions: INSS paid, dependents, alimony; the simplified discount
// is used when it's larger.
export function monthlyIncomeTax(gross: number, legalDeductions = 0) {
  const deduction = gross > 0 ? Math.max(legalDeductions, RULES_2026.simplified) : 0;
  const base = Math.max(0, round2(gross - deduction));
  const tax = tableTax(base);
  const reduction = taxReduction(gross, tax);
  return { deduction, base, tax, reduction, due: round2(tax - reduction) };
}

export type InssPlan = "full" | "simplified" | "none";

// INSS for the self-employed: 20% of earnings between the minimum wage and the ceiling, or 11% of the
// minimum wage on the simplified plan.
export function inssSelfEmployed(gross: number, plan: InssPlan): number {
  const r = RULES_2026;
  if (gross <= 0 || plan === "none") return 0;
  if (plan === "simplified") return round2(r.minimumWage * r.inssSimplifiedRate);
  return round2(Math.min(Math.max(gross, r.minimumWage), r.inssCeiling) * r.inssFullRate);
}

// Simples Nacional rate on export revenue (Anexo III, i.e. with Fator R). null above the Simples limit.
export function simplesExportRate(annualRevenue: number) {
  const band = ANEXO_III.find(([upTo]) => annualRevenue <= upTo);
  if (!band) return null;
  const [, nominal, deduct, exportShare] = band;
  const effective = annualRevenue > 0 ? (annualRevenue * nominal - deduct) / annualRevenue : nominal;
  return { nominal, effective, exportRate: effective * exportShare };
}

export type IndividualMonth = { gross: number; inss: number; tax: number; net: number };

// As an individual (pessoa física): INSS by the chosen plan, carnê-leão with the INSS deducted.
export function individualMonth(gross: number, { inss = "full", dependents = 0 }: { inss?: InssPlan; dependents?: number } = {}): IndividualMonth {
  const inssPaid = inssSelfEmployed(gross, inss);
  const tax = monthlyIncomeTax(gross, inssPaid + dependents * RULES_2026.perDependent).due;
  return { gross, inss: inssPaid, tax, net: round2(gross - inssPaid - tax) };
}

export type CompanyMonth = { gross: number; das: number; proLabore: number; inss: number; irrf: number; accountant: number; net: number };

// With a company (CNPJ) in Simples Nacional, all revenue from abroad: DAS on export revenue, a pro-labore of
// 28% of revenue (Fator R, at least the minimum wage) with 11% INSS and its IRRF, and the accountant.
// The rest is distributed as profit, which is tax-free at these amounts.
export function companyMonth(gross: number, { accountant = 250 }: { accountant?: number } = {}): CompanyMonth | null {
  const r = RULES_2026;
  const rate = simplesExportRate(gross * 12);
  if (!rate) return null;
  const das = round2(gross * rate.exportRate);
  const proLabore = round2(Math.max(r.minimumWage, gross * r.fatorR));
  const inss = round2(Math.min(proLabore, r.inssCeiling) * r.inssProLaboreRate);
  const irrf = monthlyIncomeTax(proLabore, inss).due;
  return { gross, das, proLabore, inss, irrf, accountant, net: round2(gross - das - inss - irrf - accountant) };
}

// The lowest monthly income (to the nearest R$ 100) from which a company leaves more money than being an
// individual, or null if it doesn't happen below R$ 100.000.
export function companyBreakEven(options: { inss?: InssPlan; dependents?: number; accountant?: number } = {}): number | null {
  for (let gross = 1000; gross <= 100_000; gross += 100) {
    const company = companyMonth(gross, options);
    if (company && company.net > individualMonth(gross, options).net) return gross;
  }
  return null;
}

// DARF due date: the last business day of the month after the income was received. month is 1–12.
export function darfDueDate(year: number, month: number): string {
  // Day 0 of the month after next = last day of next month.
  const d = new Date(Date.UTC(year, month + 1, 0));
  for (;;) {
    const key = d.toISOString().slice(0, 10);
    const weekday = d.getUTCDay();
    if (weekday !== 0 && weekday !== 6 && !HOLIDAYS.has(key)) return key;
    d.setUTCDate(d.getUTCDate() - 1);
  }
}
