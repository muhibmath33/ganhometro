// CSV of the whole waitlist, for the signed-in admin only.
import { cookies } from "next/headers";
import { fetchWaitlist } from "@/lib/admin/brevo";
import { ADMIN_COOKIE, isValidSession } from "@/lib/admin/session";
import { TIME_ZONE } from "@/lib/admin/stats";

const COLUMNS = ["email", "signed_up", "consent_at", "language", "landing_page", "form", "work_type", "receive_as", "income_range", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "unsubscribed"];

// Quote every field; prefix formula-like values so spreadsheets don't execute them.
function cell(value: unknown): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!isValidSession((await cookies()).get(ADMIN_COOKIE)?.value)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const result = await fetchWaitlist();
  if (!result.ok) return new Response("Waitlist not available", { status: 502 });

  const rows = result.contacts.map((c) => {
    const a = c.attributes ?? {};
    const unsubscribed = Boolean(c.emailBlacklisted) || (c.listUnsubscribed ?? []).includes(result.listId);
    return [c.email, c.createdAt, a.CONSENT_AT, a.LANGUAGE, a.LANDING_PAGE, a.SIGNUP_SOURCE, a.WORK_TYPE, a.RECEIVE_AS, a.INCOME_RANGE, a.UTM_SOURCE, a.UTM_MEDIUM, a.UTM_CAMPAIGN, a.UTM_CONTENT, a.UTM_TERM, unsubscribed ? "yes" : "no"]
      .map(cell)
      .join(",");
  });
  const csv = [COLUMNS.join(","), ...rows].join("\r\n");
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());

  // The BOM makes Excel read the accents correctly.
  return new Response("\ufeff" + csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="ganhometro-waitlist-${date}.csv"`,
      "cache-control": "no-store",
    },
  });
}
