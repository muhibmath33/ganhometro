import assert from "node:assert/strict";
import { test } from "node:test";
import { carneLeaoRate, type RateBook, rateOnOrBefore, toMarketBrl, toTaxBrl } from "./convert.ts";

// Business days only, like the Banco Central publishes them (12–13 Sep 2026 is a weekend).
const book: RateBook = {
  USD: [
    { day: "2026-09-10", buy: 5.1, parity: 1 },
    { day: "2026-09-11", buy: 5.15, parity: 1 },
    { day: "2026-09-14", buy: 5.2, parity: 1 },
    { day: "2026-09-15", buy: 5.1484, parity: 1 },
    { day: "2026-09-16", buy: 5.3, parity: 1 },
    { day: "2026-10-23", buy: 5.0371, parity: 1 },
    { day: "2026-10-26", buy: 5.4998, parity: 1 },
  ],
  EUR: [
    { day: "2026-10-23", buy: 6.0, parity: 1.1 },
    { day: "2026-10-26", buy: 6.1471, parity: 1.1177 },
  ],
};
const close = (a: number | null, b: number) => assert.ok(a !== null && Math.abs(a - b) < 1e-6, `${a} ≈ ${b}`);

test("the rate of a weekend day is the previous business day's", () => {
  assert.equal(rateOnOrBefore(book.USD, "2026-09-13")?.day, "2026-09-11");
  assert.equal(rateOnOrBefore(book.USD, "2026-09-01"), null);
});

test("carnê-leão: October income uses the last business day of 1–15 September", () => {
  assert.equal(carneLeaoRate(book, 2026, 10)?.day, "2026-09-15");
  assert.equal(carneLeaoRate(book, 2026, 12), null); // no November rates loaded
});

test("tax conversion: dollars at the rule rate, euros through the day's parity", () => {
  close(toTaxBrl(book, 3000, "USD", "2026-10-27"), 3000 * 5.1484);
  close(toTaxBrl(book, 1000, "EUR", "2026-10-25"), 1000 * 1.1 * 5.1484); // Sunday → Friday's parity
  close(toTaxBrl(book, 500, "BRL", "2026-10-27"), 500);
  assert.equal(toTaxBrl(book, 100, "GBP", "2026-10-27"), null);
});

test("market value: the currency's own buying rate on the day", () => {
  close(toMarketBrl(book, 3000, "USD", "2026-10-26"), 3000 * 5.4998);
  close(toMarketBrl(book, 1000, "EUR", "2026-10-27"), 6147.1);
});
