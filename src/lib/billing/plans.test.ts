import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { amountMatches, foundingOpen, grantFrom, signatureManifest, subscriptionUntil, verifySignature } from "./plans.ts";

test("founding offer: on sale until its last day, only when set", () => {
  assert.equal(foundingOpen("2026-12-31", "2026-12-31"), true);
  assert.equal(foundingOpen("2027-01-01", "2026-12-31"), false);
  assert.equal(foundingOpen("2026-10-27", undefined), false);
  assert.equal(foundingOpen("2026-10-27", "soon"), false);
});

test("founding year starts at launch when launch is ahead; otherwise now", () => {
  const now = new Date("2026-10-27T15:00:00Z");
  assert.equal(grantFrom("founding", now, "2027-01-15").toISOString(), "2027-01-15T03:00:00.000Z");
  assert.equal(grantFrom("founding", now, "2026-01-15").toISOString(), now.toISOString());
  assert.equal(grantFrom("yearly", now, "2027-01-15").toISOString(), now.toISOString());
});

test("subscription: next charge plus 3 days of grace, or a month from the payment", () => {
  assert.equal(subscriptionUntil("2026-11-27T10:00:00.000-04:00", new Date()).toISOString(), "2026-11-30T14:00:00.000Z");
  assert.equal(subscriptionUntil(null, new Date("2026-10-27T15:00:00Z")).toISOString(), "2026-11-30T15:00:00.000Z");
});

test("only the right amount in reais grants Pro", () => {
  assert.equal(amountMatches("monthly", 14.9, "BRL"), true);
  assert.equal(amountMatches("yearly", 1.29, "BRL"), false);
  assert.equal(amountMatches("founding", 99, "USD"), false);
});

test("Mercado Pago signature: the documented manifest and HMAC", () => {
  assert.equal(signatureManifest("123456", "req-1", "1700000000"), "id:123456;request-id:req-1;ts:1700000000;");
  assert.equal(signatureManifest("ABC12", null, "1"), "id:abc12;ts:1;");
  const secret = "s3cret";
  const v1 = createHmac("sha256", secret).update("id:999;request-id:r;ts:42;").digest("hex");
  const ok = { signature: `ts=42,v1=${v1}`, requestId: "r", dataId: "999" };
  assert.equal(verifySignature(ok, secret), true);
  assert.equal(verifySignature({ ...ok, dataId: "1000" }, secret), false);
  assert.equal(verifySignature(ok, "wrong"), false);
  assert.equal(verifySignature({ ...ok, signature: null }, secret), false);
});
