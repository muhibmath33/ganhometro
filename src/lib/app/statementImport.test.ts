import assert from "node:assert/strict";
import { test } from "node:test";
import { parseAmount, parseCsv, parseDate, readStatement } from "./statementImport.ts";

test("CSV with quotes, commas inside fields and semicolons", () => {
  assert.deepEqual(parseCsv('a,b\n"x, y","say ""hi"""\n'), [["a", "b"], ["x, y", 'say "hi"']]);
  assert.deepEqual(parseCsv("Data;Valor\r\n27/10/2026;1.234,56\r\n"), [["Data", "Valor"], ["27/10/2026", "1.234,56"]]);
});

test("amounts in any format", () => {
  assert.equal(parseAmount("1,234.56"), 1234.56);
  assert.equal(parseAmount("1.234,56"), 1234.56);
  assert.equal(parseAmount("$3,000.00"), 3000);
  assert.equal(parseAmount("USD 3000"), 3000);
  assert.equal(parseAmount("-12.50"), -12.5);
  assert.equal(parseAmount("(12.50)"), -12.5);
  assert.equal(parseAmount("1234,5"), 1234.5);
  assert.equal(parseAmount("1,234"), 1234);
  assert.equal(parseAmount("1,234,567"), 1234567);
  assert.equal(parseAmount(""), null);
});

test("dates in any format", () => {
  assert.equal(parseDate("2026-10-27 14:03:22", true), "2026-10-27");
  assert.equal(parseDate("27-10-2026", true), "2026-10-27");
  assert.equal(parseDate("10/27/2026", false), "2026-10-27");
  assert.equal(parseDate("Oct 27, 2026", true), "2026-10-27");
  assert.equal(parseDate("27 out 2026", true), "2026-10-27");
  assert.equal(parseDate("31/02/2026", true), null);
});

test("Wise classic statement: incoming only", () => {
  const csv = [
    '"TransferWise ID",Date,Amount,Currency,Description,"Payment Reference","Running Balance","Exchange From","Exchange To","Exchange Rate","Payer Name"',
    'TRANSFER-111,27-10-2026,3000.00,USD,"Received money from ACME INC with reference INV-12",INV-12,3500.00,,,,ACME INC',
    'TRANSFER-112,28-10-2026,-2500.00,USD,"Sent money to Gabriel",,1000.00,,,,',
    'BALANCE-113,29-10-2026,-500.00,USD,"Converted 500.00 USD to BRL",,500.00,USD,BRL,5.40,',
  ].join("\n");
  const r = readStatement(csv);
  assert.equal(r.format, "wise");
  assert.equal(r.rows.length, 1);
  assert.deepEqual({ ...r.rows[0], description: undefined }, { day: "2026-10-27", amount: 3000, currency: "USD", description: undefined, ref: "wise:TRANSFER-111" });
  assert.equal(r.skipped, 2);
});

test("Wise transaction history: direction IN, amount after fees", () => {
  const csv = [
    'ID,Status,Direction,"Created on","Finished on","Source fee amount","Source fee currency","Target fee amount","Target fee currency","Source name","Source amount (after fees)","Source currency","Target name","Target amount (after fees)","Target currency","Exchange rate",Reference,Batch',
    "TRANSFER-9,COMPLETED,IN,2026-10-20 10:00:00,2026-10-20 10:05:00,0,USD,0,USD,ACME INC,1500,USD,Ana,1500,USD,1,INV-9,",
    "TRANSFER-10,COMPLETED,OUT,2026-10-21 10:00:00,2026-10-21 10:05:00,4.1,USD,0,BRL,Ana,1000,USD,Ana BR,5400,BRL,5.4,,",
  ].join("\n");
  const r = readStatement(csv);
  assert.equal(r.format, "wise_history");
  assert.deepEqual(r.rows.map((x) => [x.day, x.amount, x.currency, x.ref]), [["2026-10-20", 1500, "USD", "wise_history:TRANSFER-9"]]);
});

test("Upwork: earnings rows, not fees or withdrawals", () => {
  const csv = [
    'Date,"Transaction ID",Type,Description,Agency,Freelancer,Team,"Account Name",PO,Amount,"Amount in local currency",Currency,Balance',
    '"Oct 21, 2026",901,Hourly,"Invoice for 10/13-10/19",,,ACME,,,500.00,500.00,USD,500.00',
    '"Oct 21, 2026",902,Service Fee,"Service Fee for Hourly",,,ACME,,,-50.00,-50.00,USD,450.00',
    '"Oct 22, 2026",903,Withdrawal,"Withdrawal to Payoneer",,,,,,-450.00,-450.00,USD,0.00',
    '"Oct 25, 2026",904,Fixed Price,"Milestone 1",,,ACME,,,800.00,800.00,USD,800.00',
  ].join("\n");
  const r = readStatement(csv);
  assert.equal(r.format, "upwork");
  assert.deepEqual(r.rows.map((x) => [x.day, x.amount, x.ref]), [["2026-10-21", 500, "upwork:901"], ["2026-10-25", 800, "upwork:904"]]);
});

test("any other file, by column names in Portuguese, with day-first dates", () => {
  const csv = "Data;Descrição;Valor;Moeda\n03/10/2026;Pagamento cliente X;1.200,00;EUR\n15/10/2026;Saque para banco;-1.200,00;EUR\n";
  const r = readStatement(csv);
  assert.equal(r.format, "generic");
  assert.deepEqual(r.rows.map((x) => [x.day, x.amount, x.currency]), [["2026-10-03", 1200, "EUR"]]);
  // No ID column: the same line always gives the same reference, so a second import is skipped.
  assert.equal(readStatement(csv).rows[0].ref, r.rows[0].ref);
});
