"use server";

import { redirect } from "next/navigation";
import { routes } from "@/i18n/config";
import { getFoundingDictionary } from "@/i18n/founding";
import { dayKey } from "@/lib/app/time";
import { billingConfigured, createPreference } from "@/lib/billing/mercadopago";
import { foundingOpen, PRODUCTS } from "@/lib/billing/plans";
import { site } from "@/lib/site";
import { adminClient } from "@/lib/supabase/admin";

export type FoundingState = { error?: "email" | "closed" | "generic" } | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The founding offer from the public page: no account needed, the purchase is tied to the email and applied
// when that account signs up (or right away if it already exists).
export async function startFoundingCheckout(_prev: FoundingState, form: FormData): Promise<FoundingState> {
  // Filled in only by bots (the field is hidden from people).
  if (String(form.get("website") ?? "")) return { error: "generic" };
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) return { error: "email" };
  const locale = form.get("locale") === "en" ? "en" : "pt-BR";
  const admin = adminClient();
  if (!admin || !billingConfigured() || !foundingOpen(dayKey(new Date(), "America/Sao_Paulo"), process.env.FOUNDING_UNTIL)) return { error: "closed" };

  const { data: checkout } = await admin.from("checkouts").insert({ email, product: "founding", amount: PRODUCTS.founding.amount }).select("id").single();
  if (!checkout) return { error: "generic" };
  const started = await createPreference({
    checkoutId: checkout.id,
    title: getFoundingDictionary(locale).title,
    amount: PRODUCTS.founding.amount,
    email,
    backUrl: `${site.url}${routes.founding[locale]}`,
    notificationUrl: `${site.url}/api/mercadopago/webhook`,
  });
  if (!started?.init_point) return { error: "generic" };
  await admin.from("checkouts").update({ provider_ref: started.id }).eq("id", checkout.id);
  redirect(started.init_point);
}
