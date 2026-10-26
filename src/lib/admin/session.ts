// Password login for /admin. Server-only: imported by server components, actions and routes.
// The session cookie is "<expiry>.<HMAC(expiry)>"; changing ADMIN_PASSWORD logs everyone out.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "gm_admin";
const SESSION_DAYS = 7;
export const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;

const password = () => process.env.ADMIN_PASSWORD ?? "";

// Admin stays off until a long enough password is configured.
export const adminEnabled = () => password().length >= 12;

const secret = () => process.env.ADMIN_SESSION_SECRET || `gm-admin:${password()}`;
const sign = (value: string) => createHmac("sha256", secret()).update(value).digest("hex");
const digest = (value: string) => createHash("sha256").update(value).digest();

export function passwordMatches(input: string): boolean {
  return adminEnabled() && timingSafeEqual(digest(input), digest(password()));
}

export function createSessionToken(now = Date.now()): string {
  const expiry = String(now + SESSION_MAX_AGE * 1000);
  return `${expiry}.${sign(expiry)}`;
}

export function isValidSession(token: string | undefined, now = Date.now()): boolean {
  if (!token || !adminEnabled()) return false;
  const [expiry, signature] = token.split(".");
  if (!expiry || !signature || Number(expiry) < now) return false;
  const expected = Buffer.from(sign(expiry));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
