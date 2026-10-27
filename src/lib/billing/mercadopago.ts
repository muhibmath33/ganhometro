// Mercado Pago API (server only): Checkout Pro for one-time payments, Assinaturas for the monthly card plan,
// and reading back payments and subscriptions. MP_API_URL is only for local tests against a fake server.
import "server-only";

const API = process.env.MP_API_URL || "https://api.mercadopago.com";
export const billingConfigured = () => Boolean(process.env.MP_ACCESS_TOKEN);

async function call<T>(method: "GET" | "POST" | "PUT", path: string, body?: unknown, idempotencyKey?: string): Promise<T | null> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[mercadopago]", method, path, res.status, (await res.text()).slice(0, 300));
      return null;
    }
    return (await res.json()) as T;
  } catch (error) {
    console.error("[mercadopago]", method, path, error);
    return null;
  }
}

export type MpPayment = {
  id: number | string;
  status: string;
  external_reference: string | null;
  transaction_amount: number;
  currency_id: string;
  payment_method_id?: string;
  payment_type_id?: string;
  date_approved?: string | null;
  payer?: { email?: string | null };
  metadata?: Record<string, unknown>;
};
export type MpPreapproval = {
  id: string;
  status: string; // pending, authorized, paused, cancelled
  external_reference: string | null;
  next_payment_date?: string | null;
  init_point?: string;
};
export type MpAuthorizedPayment = { id: number | string; preapproval_id: string; payment?: { id: number | string; status: string } | null };

// One-time payment page (Pix or card). external_reference is our checkout id.
export function createPreference(p: {
  checkoutId: string;
  title: string;
  amount: number;
  email: string | null;
  backUrl: string;
  notificationUrl: string;
}) {
  return call<{ id: string; init_point: string }>(
    "POST",
    "/checkout/preferences",
    {
      items: [{ id: p.checkoutId, title: p.title, quantity: 1, unit_price: p.amount, currency_id: "BRL" }],
      payer: p.email ? { email: p.email } : undefined,
      external_reference: p.checkoutId,
      back_urls: { success: p.backUrl, pending: p.backUrl, failure: p.backUrl },
      auto_return: "approved",
      notification_url: p.notificationUrl,
      statement_descriptor: "GANHOMETRO",
      payment_methods: { installments: 1 },
    },
    p.checkoutId,
  );
}

// Monthly card subscription; the person authorizes it on Mercado Pago's page.
export function createSubscription(p: { checkoutId: string; reason: string; amount: number; email: string; backUrl: string; notificationUrl: string }) {
  return call<MpPreapproval>(
    "POST",
    "/preapproval",
    {
      reason: p.reason,
      external_reference: p.checkoutId,
      payer_email: p.email,
      back_url: p.backUrl,
      notification_url: p.notificationUrl,
      status: "pending",
      auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: p.amount, currency_id: "BRL" },
    },
    p.checkoutId,
  );
}

export const cancelSubscription = (id: string) => call<MpPreapproval>("PUT", `/preapproval/${encodeURIComponent(id)}`, { status: "cancelled" });
export const getPayment = (id: string) => call<MpPayment>("GET", `/v1/payments/${encodeURIComponent(id)}`);
export const getPreapproval = (id: string) => call<MpPreapproval>("GET", `/preapproval/${encodeURIComponent(id)}`);
export const getAuthorizedPayment = (id: string) => call<MpAuthorizedPayment>("GET", `/authorized_payments/${encodeURIComponent(id)}`);
