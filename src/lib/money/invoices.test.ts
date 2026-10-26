import assert from "node:assert/strict";
import { test } from "node:test";
import { amountFromHours, invoiceState, nextInvoiceNumber } from "./invoices.ts";

const invoice = { amount: 1000, due_on: "2026-10-20", status: "sent" as const };

test("invoice state from what was paid and the due date", () => {
  assert.deepEqual(invoiceState(invoice, 0, "2026-10-15"), { state: "open", balance: 1000 });
  assert.deepEqual(invoiceState(invoice, 400, "2026-10-15"), { state: "partial", balance: 600 });
  assert.deepEqual(invoiceState(invoice, 1000, "2026-10-30"), { state: "paid", balance: 0 });
  assert.deepEqual(invoiceState(invoice, 400, "2026-10-21"), { state: "overdue", balance: 600 });
  assert.equal(invoiceState(invoice, 0, "2026-10-21", 2).state, "open"); // within the client's grace days
  assert.equal(invoiceState({ ...invoice, status: "draft" }, 0, "2026-12-01").state, "draft");
  assert.deepEqual(invoiceState({ ...invoice, status: "void" }, 0, "2026-12-01"), { state: "void", balance: 0 });
});

test("next invoice number continues the year", () => {
  assert.equal(nextInvoiceNumber([], 2026), "2026-001");
  assert.equal(nextInvoiceNumber(["2026-001", "2026-009", "2025-040", "ACME-7"], 2026), "2026-010");
});

test("amount from paid hours in a period, São Paulo days", () => {
  const at = (day: string, hour: number) => new Date(Date.parse(`${day}T00:00:00Z`) + (hour + 3) * 3_600_000).toISOString();
  const entries = [
    { kind: "paid" as const, started_at: at("2026-10-05", 9), ended_at: at("2026-10-05", 17), units: null },
    { kind: "unpaid" as const, started_at: at("2026-10-06", 9), ended_at: at("2026-10-06", 11), units: null },
    { kind: "paid" as const, started_at: at("2026-10-12", 9), ended_at: at("2026-10-12", 12), units: null }, // outside
  ];
  const r = amountFromHours(entries, 30, { fromDay: "2026-10-01", toDay: "2026-10-11", timeZone: "America/Sao_Paulo", now: Date.parse("2026-10-27T12:00:00Z") });
  assert.equal(r.hours, 8);
  assert.equal(r.amount, 240);
});
