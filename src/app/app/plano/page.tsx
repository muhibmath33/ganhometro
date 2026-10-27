import { Suspense } from "react";
import { cancelSubscription, startCheckout } from "@/app/app/actions";
import { formatDay } from "@/components/calculators/shared";
import { ConfirmDelete } from "@/components/app/ConfirmDelete";
import { Card, PageSkeleton } from "@/components/app/ui";
import { getAppDictionary } from "@/i18n/app";
import { fill } from "@/i18n/config";
import { profileLocale, requireUser } from "@/lib/app/session";
import { dayKey } from "@/lib/app/time";
import { billingConfigured } from "@/lib/billing/mercadopago";
import { foundingOpen, type Product } from "@/lib/billing/plans";
import { processPayment, processPreapproval } from "@/lib/billing/process";
import { formatMoney } from "@/lib/calc";

const button = "min-h-12 cursor-pointer rounded-[10px] border-0 bg-brand px-5 font-sans text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50";

async function Plan({ searchParams }: { searchParams: PageProps<"/app/plano">["searchParams"] }) {
  const { supabase, profile, user } = await requireUser();
  const locale = profileLocale(profile);
  const t = getAppDictionary(locale);
  const p = t.plans;
  const params = await searchParams;

  // Back from Mercado Pago: confirm with them right away (the notification may still be on its way).
  // processPayment reads the payment from Mercado Pago, so the id in the address can't grant anything by itself.
  const paymentId = typeof params.payment_id === "string" && /^\d{1,24}$/.test(params.payment_id) ? params.payment_id : null;
  const preapprovalId = typeof params.preapproval_id === "string" && /^[\w-]{1,64}$/.test(params.preapproval_id) ? params.preapproval_id : null;
  const returned = paymentId ? await processPayment(paymentId).catch(() => null) : null;
  if (preapprovalId) await processPreapproval(preapprovalId).catch(() => null);

  // Read the plan after any update above.
  const [{ data: plan }, { data: purchases }] = await Promise.all([
    supabase.from("profiles").select("plan, pro_until, subscription_status, subscription_next").eq("id", user.id).single(),
    supabase.from("billing_events").select("id, product, status, amount, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
  ]);
  const now = new Date();
  const proUntil = plan?.pro_until ? new Date(plan.pro_until) : null;
  const pro = plan?.plan === "pro" || (proUntil !== null && proUntil > now);
  const untilText = proUntil ? formatDay(dayKey(proUntil, profile.timezone), locale) : "";
  const subscribed = plan?.subscription_status === "authorized";
  const today = dayKey(now, profile.timezone);
  const offers: Product[] = [
    ...(foundingOpen(today, process.env.FOUNDING_UNTIL) ? (["founding"] as const) : []),
    ...(subscribed ? [] : (["monthly"] as const)),
    "yearly",
  ];
  const ready = billingConfigured();

  // What to say about the return from Mercado Pago, or a cancellation.
  const result =
    params.cancelada === "1"
      ? p.results.cancelled
      : typeof params.erro === "string"
        ? params.erro === "indisponivel"
          ? p.unavailable
          : p.results.error
        : returned?.status === "approved" || (preapprovalId && subscribed)
          ? p.results.approved
          : returned?.status === "pending" || returned?.status === "in_process" || (preapprovalId && !subscribed)
            ? p.results.pending
            : paymentId || params.status === "failure" || params.status === "rejected"
              ? p.results.failure
              : null;

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em]">{p.title}</h1>
        <p className="m-0 max-w-[640px] text-[15px] text-ink-soft">{p.lead}</p>
      </div>

      {result && (
        <p role="status" className="m-0 rounded-[12px] bg-brand-tint px-4 py-3 text-[14px] font-semibold text-brand">
          {result}
        </p>
      )}

      <Card>
        <p className="m-0 text-[17px] font-bold">
          {!pro ? p.free : plan?.plan === "pro" && !proUntil ? p.proForever : fill(p.proUntil, { date: untilText })}
        </p>
        {plan?.subscription_status === "authorized" && plan.subscription_next && (
          <p className="m-0 text-[14px] text-ink-soft">
            {fill(p.subscriptionActive, { date: formatDay(dayKey(new Date(plan.subscription_next), profile.timezone), locale) })}
          </p>
        )}
        {plan?.subscription_status === "cancelled" && pro && <p className="m-0 text-[14px] text-ink-soft">{fill(p.subscriptionCancelled, { date: untilText })}</p>}
        {subscribed && (
          <ConfirmDelete
            action={cancelSubscription}
            id=""
            labels={{ button: p.cancel, question: p.confirmCancel, confirm: p.confirm, cancel: t.common.cancel }}
          />
        )}
      </Card>

      {!ready && <p className="m-0 text-[14px] font-semibold text-amber-ink">{p.unavailable}</p>}

      <div className="grid items-stretch gap-4 md:grid-cols-2">
        {offers.map((product) => {
          const o = p.products[product];
          return (
            <Card key={product} className={product === "founding" ? "border-brand" : ""}>
              <div className="flex flex-col gap-1">
                <h2 className="m-0 text-[17px] font-bold">{o.title}</h2>
                <span className="font-mono text-[22px] font-semibold">{o.price}</span>
              </div>
              <p className="m-0 flex-1 text-[14px] text-ink-soft">{o.how}</p>
              <form action={startCheckout}>
                <input type="hidden" name="product" value={product} />
                <button type="submit" disabled={!ready} className={button}>
                  {o.button}
                </button>
              </form>
            </Card>
          );
        })}
      </div>
      <p className="m-0 text-[13px] text-muted">{p.secure}</p>

      <Card>
        <h2 className="m-0 text-[17px] font-bold">{p.included}</h2>
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[14px]">
          {p.features.map((f) => (
            <li key={f} className="flex items-baseline gap-2">
              <span aria-hidden="true" className="text-brand">
                ✓
              </span>
              {f}
            </li>
          ))}
        </ul>
      </Card>

      {purchases && purchases.length > 0 && (
        <Card>
          <h2 className="m-0 text-[17px] font-bold">{p.purchases}</h2>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {purchases.map((e) => (
              <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-2 rounded-[12px] bg-paper px-4 py-3 text-[14px]">
                <span className="font-semibold">
                  {p.products[e.product as Product]?.title ?? e.product} · {formatDay(dayKey(new Date(e.created_at), profile.timezone), locale)}
                </span>
                <span className="text-ink-soft">
                  {e.amount !== null && <span className="font-mono">{formatMoney("R$", Number(e.amount), locale)}</span>} ·{" "}
                  {p.statuses[e.status as keyof typeof p.statuses] ?? e.status}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

export default function PlanPage({ searchParams }: PageProps<"/app/plano">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Plan searchParams={searchParams} />
    </Suspense>
  );
}
