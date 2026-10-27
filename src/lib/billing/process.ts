// What happens when Mercado Pago reports a payment or a subscription change: the facts are always read back
// from Mercado Pago (never taken from the notification), recorded once per payment, and Pro time is granted
// or taken back in the database (apply_billing_event / revoke_billing_event), so repeats change nothing.
// Used by the webhook and by the pages people return to after paying.
import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { getAuthorizedPayment, getPayment, getPreapproval, type MpPayment } from "./mercadopago";
import { amountMatches, grantFrom, isProduct, PRODUCTS, REVERSED, subscriptionUntil } from "./plans";

type Admin = NonNullable<ReturnType<typeof adminClient>>;

async function checkoutById(admin: Admin, id: string | null | undefined) {
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await admin.from("checkouts").select("*").eq("id", id).maybeSingle();
  return data;
}

const methodOf = (p: MpPayment) => (p.payment_method_id === "pix" ? "pix" : p.payment_type_id === "credit_card" ? "card" : (p.payment_type_id ?? null));

// preapprovalId: for subscription charges, whose payment may not carry our reference.
export async function processPayment(paymentId: string, { preapprovalId }: { preapprovalId?: string } = {}) {
  const admin = adminClient();
  if (!admin) return null;
  const p = await getPayment(paymentId);
  if (!p) return null;
  let checkout = await checkoutById(admin, p.external_reference);
  let pre = null;
  if (!checkout && preapprovalId) {
    pre = await getPreapproval(preapprovalId);
    checkout = await checkoutById(admin, pre?.external_reference);
  }
  if (!checkout || !isProduct(checkout.product)) return null;
  const product = checkout.product;
  if (product === "monthly" && !pre && checkout.provider_ref) pre = await getPreapproval(checkout.provider_ref);

  const paidAt = p.date_approved ? new Date(p.date_approved) : new Date();
  // A payment for the wrong amount or currency is recorded but never grants anything.
  const status = amountMatches(product, p.transaction_amount, p.currency_id) ? p.status : `mismatch:${p.status}`;
  const grant =
    product === "monthly"
      ? { grant_until: subscriptionUntil(pre?.next_payment_date, paidAt).toISOString(), grant_months: null, grant_from: null }
      : { grant_until: null, grant_months: PRODUCTS[product].months, grant_from: grantFrom(product, paidAt, process.env.LAUNCH_DATE).toISOString() };

  const { data: event, error } = await admin
    .from("billing_events")
    .upsert(
      {
        provider: "mercadopago",
        provider_payment_id: String(p.id),
        checkout_id: checkout.id,
        user_id: checkout.user_id,
        email: (checkout.email ?? p.payer?.email ?? null)?.toLowerCase() ?? null,
        product,
        status,
        amount: p.transaction_amount,
        currency: p.currency_id,
        method: methodOf(p),
        ...grant,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "provider,provider_payment_id" },
    )
    .select("id")
    .single();
  if (error || !event) {
    console.error("[billing] could not record payment", paymentId, error?.message);
    throw new Error("billing_record_failed");
  }
  if (status === "approved") await admin.rpc("apply_billing_event", { event_id: event.id });
  else if (REVERSED.has(status)) await admin.rpc("revoke_billing_event", { event_id: event.id });
  return { status, product, checkout };
}

// A subscription was authorized, paused or cancelled: keep the profile's copy up to date.
export async function processPreapproval(preapprovalId: string) {
  const admin = adminClient();
  if (!admin) return null;
  const pre = await getPreapproval(preapprovalId);
  if (!pre) return null;
  const checkout = await checkoutById(admin, pre.external_reference);
  if (!checkout?.user_id) return null;
  await admin
    .from("profiles")
    .update({ subscription_id: pre.id, subscription_status: pre.status, subscription_next: pre.next_payment_date ?? null })
    .eq("id", checkout.user_id);
  return pre;
}

// A subscription charge: record its payment like any other.
export async function processAuthorizedPayment(id: string) {
  const ap = await getAuthorizedPayment(id);
  if (!ap?.payment?.id) return null;
  return processPayment(String(ap.payment.id), { preapprovalId: ap.preapproval_id });
}

// The notification types Mercado Pago sends (new "type" and older "topic" names).
export async function handleNotification(type: string, id: string) {
  if (type === "payment") return processPayment(id);
  if (type === "subscription_preapproval" || type === "preapproval") return processPreapproval(id);
  if (type === "subscription_authorized_payment" || type === "authorized_payment") return processAuthorizedPayment(id);
  return null;
}
