// Plans, prices and the checks around Mercado Pago notifications (Stage 1, sprint 9).
// Only Node built-ins, so `npm test` runs it directly.
import { createHmac, timingSafeEqual } from "node:crypto";

export type Product = "monthly" | "yearly" | "founding";
export const PRODUCTS: Record<Product, { amount: number; months: number }> = {
  monthly: { amount: 14.9, months: 1 }, // card subscription, renewed by Mercado Pago
  yearly: { amount: 129, months: 12 }, // one-time, Pix or card
  founding: { amount: 99, months: 12 }, // one-time, before launch; the year starts at launch
};
// A monthly subscriber stays Pro this long past the next charge date, so a late charge doesn't cut them off.
export const SUBSCRIPTION_GRACE_DAYS = 3;

export const isProduct = (v: unknown): v is Product => v === "monthly" || v === "yearly" || v === "founding";

// The founding offer is on sale until its last day (inclusive), when one is set.
export function foundingOpen(today: string, foundingUntil: string | undefined): boolean {
  return Boolean(foundingUntil && /^\d{4}-\d{2}-\d{2}$/.test(foundingUntil) && today <= foundingUntil);
}

// When a one-time purchase's Pro year starts: the launch day for the founding offer (if it's still ahead),
// otherwise now.
export function grantFrom(product: Product, now: Date, launchDate: string | undefined): Date {
  if (product === "founding" && launchDate && /^\d{4}-\d{2}-\d{2}$/.test(launchDate)) {
    const launch = new Date(`${launchDate}T03:00:00Z`); // midnight in Brasília
    if (launch > now) return launch;
  }
  return now;
}

// A subscriber's paid-until: the next charge date plus grace, or a month from the payment if unknown.
export function subscriptionUntil(nextCharge: string | null | undefined, paidAt: Date): Date {
  const base = nextCharge && !Number.isNaN(Date.parse(nextCharge)) ? new Date(nextCharge) : new Date(Date.UTC(paidAt.getUTCFullYear(), paidAt.getUTCMonth() + 1, paidAt.getUTCDate(), paidAt.getUTCHours(), paidAt.getUTCMinutes()));
  return new Date(base.getTime() + SUBSCRIPTION_GRACE_DAYS * 86_400_000);
}

// A payment only grants Pro when it's for the right amount, in reais. Anything else is recorded, not applied.
export function amountMatches(product: Product, amount: number | null | undefined, currency: string | null | undefined): boolean {
  return currency === "BRL" && typeof amount === "number" && amount >= PRODUCTS[product].amount - 0.01;
}

// Mercado Pago signs notifications: header x-signature "ts=…,v1=…", an HMAC-SHA256 (hex) of
// "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" with the webhook secret. Parts that are missing are left
// out of the template; an alphanumeric data.id is lower-cased.
export function signatureManifest(dataId: string | null, requestId: string | null, ts: string): string {
  const id = dataId && /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  return `${id ? `id:${id};` : ""}${requestId ? `request-id:${requestId};` : ""}ts:${ts};`;
}

export function verifySignature(
  { signature, requestId, dataId }: { signature: string | null; requestId: string | null; dataId: string | null },
  secret: string,
): boolean {
  if (!signature) return false;
  const parts = Object.fromEntries(
    signature.split(",").map((p) => {
      const [k, ...v] = p.trim().split("=");
      return [k, v.join("=")];
    }),
  );
  if (!parts.ts || !parts.v1) return false;
  const expected = createHmac("sha256", secret).update(signatureManifest(dataId, requestId, parts.ts)).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Mercado Pago payment statuses that take Pro back.
export const REVERSED = new Set(["refunded", "charged_back", "cancelled"]);
