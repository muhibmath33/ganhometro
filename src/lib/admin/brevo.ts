// Reads the waitlist contacts from Brevo for the admin page and CSV export.

const BREVO_API = process.env.BREVO_API_URL || "https://api.brevo.com/v3"; // override only for local tests
const PAGE = 500; // Brevo's maximum page size for list contacts

export type Contact = {
  email: string;
  createdAt: string;
  emailBlacklisted?: boolean;
  listUnsubscribed?: number[];
  attributes?: Record<string, string | number | boolean | null | undefined>;
};

export type WaitlistResult =
  | { ok: true; contacts: Contact[]; listId: number }
  | { ok: false; reason: "not_configured" | "error"; detail?: string };

export async function fetchWaitlist(): Promise<WaitlistResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_LIST_ID);
  if (!apiKey || !listId) return { ok: false, reason: "not_configured" };

  const contacts: Contact[] = [];
  try {
    for (let offset = 0; offset < 100_000; offset += PAGE) {
      const res = await fetch(
        `${BREVO_API}/contacts/lists/${listId}/contacts?limit=${PAGE}&offset=${offset}&sort=desc`,
        { headers: { "api-key": apiKey, accept: "application/json" }, signal: AbortSignal.timeout(10000) },
      );
      if (!res.ok) return { ok: false, reason: "error", detail: `Brevo answered ${res.status}` };
      const page: Contact[] = (await res.json()).contacts ?? [];
      contacts.push(...page);
      if (page.length < PAGE) break;
    }
  } catch (err) {
    return { ok: false, reason: "error", detail: err instanceof Error ? err.message : String(err) };
  }
  return { ok: true, contacts, listId };
}
