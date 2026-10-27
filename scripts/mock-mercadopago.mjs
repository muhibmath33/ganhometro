// A fake Mercado Pago for local tests: the API calls the app makes, a stand-in checkout page, and signed
// notifications. Usage: node scripts/mock-mercadopago.mjs [port] [webhook secret]
import { createHmac } from "node:crypto";
import { createServer } from "node:http";

const PORT = Number(process.argv[2] ?? 54399);
const SECRET = process.argv[3] ?? "test-webhook-secret";
const BASE = `http://127.0.0.1:${PORT}`;
const prefs = new Map();
const payments = new Map();
const preapprovals = new Map();
const authorized = new Map();
let n = 0;
const nextId = () => ++n;

const json = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
};
const html = (res, body) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(`<!doctype html><meta charset="utf-8"><title>Mercado Pago (teste)</title><body style="font-family:sans-serif;padding:24px">${body}</body>`);
};
const redirect = (res, url) => {
  res.writeHead(303, { Location: url });
  res.end();
};
const readBody = (req) =>
  new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve(Object.fromEntries(new URLSearchParams(data)));
      }
    });
  });

// Sends a notification the way Mercado Pago does, signed with the webhook secret.
async function notify(url, type, id) {
  if (!url) return;
  const ts = String(Math.floor(Date.now() / 1000));
  const requestId = `req-${nextId()}`;
  const dataId = /^[a-z0-9]+$/i.test(String(id)) ? String(id).toLowerCase() : String(id);
  const v1 = createHmac("sha256", SECRET).update(`id:${dataId};request-id:${requestId};ts:${ts};`).digest("hex");
  const target = new URL(url);
  target.searchParams.set("data.id", String(id));
  target.searchParams.set("type", type);
  try {
    const r = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-signature": `ts=${ts},v1=${v1}`, "x-request-id": requestId },
      body: JSON.stringify({ type, action: `${type}.updated`, data: { id: String(id) } }),
    });
    console.log("notify", type, id, r.status);
  } catch (e) {
    console.log("notify failed", type, id, e.message);
  }
}

function newPayment(fields) {
  const id = 9_000_000 + nextId();
  const p = { id, currency_id: "BRL", date_approved: fields.status === "approved" ? new Date().toISOString() : null, ...fields };
  payments.set(String(id), p);
  return p;
}

const plusDays = (days) => new Date(Date.now() + days * 86_400_000).toISOString();

createServer(async (req, res) => {
  const url = new URL(req.url, BASE);
  const path = url.pathname;
  const parts = path.split("/").filter(Boolean);
  const api = req.headers.authorization?.startsWith("Bearer ");

  // --- API ---
  if (req.method === "POST" && path === "/checkout/preferences" && api) {
    const body = await readBody(req);
    const id = `pref-${nextId()}`;
    prefs.set(id, body);
    return json(res, 201, { id, init_point: `${BASE}/checkout/${id}` });
  }
  if (req.method === "POST" && path === "/preapproval" && api) {
    const body = await readBody(req);
    const id = `pre${nextId()}`;
    const pre = { id, status: "pending", external_reference: body.external_reference, payer_email: body.payer_email, back_url: body.back_url, notification_url: body.notification_url, auto_recurring: body.auto_recurring, init_point: `${BASE}/subscribe/${id}` };
    preapprovals.set(id, pre);
    return json(res, 201, pre);
  }
  if (req.method === "PUT" && parts[0] === "preapproval" && api) {
    const pre = preapprovals.get(parts[1]);
    if (!pre) return json(res, 404, {});
    Object.assign(pre, await readBody(req));
    return json(res, 200, pre);
  }
  if (req.method === "GET" && api) {
    if (parts[0] === "v1" && parts[1] === "payments") return payments.has(parts[2]) ? json(res, 200, payments.get(parts[2])) : json(res, 404, {});
    if (parts[0] === "preapproval") return preapprovals.has(parts[1]) ? json(res, 200, preapprovals.get(parts[1])) : json(res, 404, {});
    if (parts[0] === "authorized_payments") return authorized.has(parts[1]) ? json(res, 200, authorized.get(parts[1])) : json(res, 404, {});
  }

  // --- Stand-in checkout pages ---
  if (req.method === "GET" && parts[0] === "checkout" && prefs.has(parts[1])) {
    const pref = prefs.get(parts[1]);
    return html(
      res,
      `<h1>Pagar ${pref.items[0].title}</h1><p>R$ ${pref.items[0].unit_price}</p>
       <form method="post" action="/checkout/${parts[1]}/pay?result=approved"><button id="approve">Aprovar (Pix)</button></form>
       <form method="post" action="/checkout/${parts[1]}/pay?result=rejected"><button id="reject">Recusar</button></form>`,
    );
  }
  if (req.method === "POST" && parts[0] === "checkout" && parts[2] === "pay" && prefs.has(parts[1])) {
    const pref = prefs.get(parts[1]);
    const status = url.searchParams.get("result") ?? "approved";
    const p = newPayment({
      status,
      external_reference: pref.external_reference,
      transaction_amount: Number(url.searchParams.get("amount") ?? pref.items[0].unit_price),
      payment_method_id: "pix",
      payment_type_id: "bank_transfer",
      payer: { email: pref.payer?.email ?? null },
    });
    if (url.searchParams.get("nowebhook") !== "1") await notify(pref.notification_url, "payment", p.id);
    const back = new URL(pref.back_urls.success);
    back.searchParams.set("payment_id", String(p.id));
    back.searchParams.set("status", status);
    back.searchParams.set("external_reference", pref.external_reference);
    return redirect(res, back.toString());
  }
  if (req.method === "GET" && parts[0] === "subscribe" && preapprovals.has(parts[1])) {
    return html(res, `<h1>Assinar</h1><form method="post" action="/subscribe/${parts[1]}/authorize"><button id="authorize">Autorizar (cartão)</button></form>`);
  }
  // Authorizing charges the first month, like Mercado Pago. Renewals use /_renew.
  const charge = async (pre) => {
    pre.next_payment_date = plusDays(30 * (pre.charges = (pre.charges ?? 0) + 1));
    const p = newPayment({ status: "approved", external_reference: null, transaction_amount: pre.auto_recurring.transaction_amount, payment_method_id: "visa", payment_type_id: "credit_card", payer: { email: pre.payer_email } });
    const apId = `ap-${nextId()}`;
    authorized.set(apId, { id: apId, preapproval_id: pre.id, payment: { id: p.id, status: "approved" } });
    await notify(pre.notification_url, "subscription_authorized_payment", apId);
    return p;
  };
  if (req.method === "POST" && parts[0] === "subscribe" && parts[2] === "authorize" && preapprovals.has(parts[1])) {
    const pre = preapprovals.get(parts[1]);
    pre.status = "authorized";
    await charge(pre);
    await notify(pre.notification_url, "subscription_preapproval", pre.id);
    const back = new URL(pre.back_url);
    back.searchParams.set("preapproval_id", pre.id);
    return redirect(res, back.toString());
  }

  // --- Test helpers ---
  if (req.method === "POST" && parts[0] === "_renew" && preapprovals.has(parts[1])) return json(res, 200, await charge(preapprovals.get(parts[1])));
  if (req.method === "POST" && parts[0] === "_refund" && payments.has(parts[1])) {
    const p = payments.get(parts[1]);
    p.status = "refunded";
    const pref = [...prefs.values()].find((x) => x.external_reference === p.external_reference);
    await notify(pref?.notification_url, "payment", p.id);
    return json(res, 200, p);
  }
  if (req.method === "POST" && parts[0] === "_notify") {
    // Re-sends a notification, optionally with a bad signature.
    const body = await readBody(req);
    if (body.badSignature) {
      const r = await fetch(`${body.url}?data.id=${body.id}&type=${body.type}`, { method: "POST", headers: { "Content-Type": "application/json", "x-signature": "ts=1,v1=bad", "x-request-id": "r" }, body: JSON.stringify({ type: body.type, data: { id: body.id } }) });
      return json(res, 200, { status: r.status });
    }
    await notify(body.url, body.type, body.id);
    return json(res, 200, { ok: true });
  }
  if (path === "/_state") return json(res, 200, { prefs: [...prefs], payments: [...payments], preapprovals: [...preapprovals], authorized: [...authorized] });
  json(res, 404, { error: "not found" });
}).listen(PORT, "127.0.0.1", () => console.log(`mock Mercado Pago on ${BASE}`));
