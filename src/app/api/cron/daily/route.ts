// Daily job (Vercel Cron, after the Banco Central publishes the closing rates): stores the latest PTAX rates,
// then emails DARF/DAS reminders and late-payment alerts.
import { addDays } from "@/lib/app/time";
import { runDailyNotifications } from "@/lib/jobs/notifications";
import { fetchPtaxRange } from "@/lib/money/ptax";
import { adminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  // Vercel Cron sends the project's CRON_SECRET as a bearer token.
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const admin = adminClient();
  if (!admin) return Response.json({ ok: false, error: "Supabase is not configured" }, { status: 500 });

  // The last ten days, so a missed run or a long holiday fills itself in.
  const to = new Date().toISOString().slice(0, 10);
  const from = addDays(to, -10);
  const results = await Promise.all(
    (["USD", "EUR", "GBP"] as const).map(async (currency) => {
      try {
        const rows = await fetchPtaxRange(currency, from, to);
        const { error } = await admin.from("ptax_rates").upsert(rows, { onConflict: "currency,day" });
        return { currency, rows: rows.length, error: error?.message };
      } catch (err) {
        return { currency, rows: 0, error: String(err) };
      }
    }),
  );
  // Reminders run even if a rate fetch failed: the stored rates are enough for them.
  let emails: Awaited<ReturnType<typeof runDailyNotifications>> | { error: string };
  try {
    emails = await runDailyNotifications();
  } catch (err) {
    emails = { error: String(err) };
  }
  const ok = results.every((r) => !r.error) && !("error" in emails);
  return Response.json({ ok, rates: results, emails }, { status: ok ? 200 : 502 });
}
