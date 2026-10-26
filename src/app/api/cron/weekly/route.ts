// Weekly job (Vercel Cron, Monday mornings in Brazil): emails last week's summary.
import { runWeeklySummary } from "@/lib/jobs/notifications";

export async function GET(request: Request) {
  // Vercel Cron sends the project's CRON_SECRET as a bearer token.
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    return Response.json({ ok: true, emails: await runWeeklySummary() });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
