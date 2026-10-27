// Mercado Pago notifications (payments and subscriptions). The signature is checked when MP_WEBHOOK_SECRET is
// set (it must be in production); either way the facts are read back from Mercado Pago before anything changes.
import { handleNotification } from "@/lib/billing/process";
import { verifySignature } from "@/lib/billing/plans";

export async function POST(request: Request) {
  const url = new URL(request.url);
  let body: { type?: string; topic?: string; action?: string; data?: { id?: string | number } } = {};
  try {
    body = await request.json();
  } catch {
    // Some notifications carry everything in the query string.
  }
  const type = body.type ?? body.topic ?? url.searchParams.get("type") ?? url.searchParams.get("topic") ?? "";
  const id = String(body.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");
  if (!type || !/^[\w-]{1,64}$/.test(id)) return new Response("ignored", { status: 200 });

  const secret = process.env.MP_WEBHOOK_SECRET;
  if (secret) {
    const valid = verifySignature(
      { signature: request.headers.get("x-signature"), requestId: request.headers.get("x-request-id"), dataId: url.searchParams.get("data.id") ?? id },
      secret,
    );
    if (!valid) return new Response("bad signature", { status: 401 });
  } else if (process.env.NODE_ENV === "production") {
    console.warn("[mercadopago] MP_WEBHOOK_SECRET is not set; notifications aren't verified");
  }

  try {
    await handleNotification(type, id);
  } catch (error) {
    // A non-2xx answer makes Mercado Pago try again later.
    console.error("[mercadopago] notification failed", type, id, error);
    return new Response("retry", { status: 500 });
  }
  return new Response("ok", { status: 200 });
}
