// Waitlist signup → Brevo contact list. See README for the required env vars and
// the contact attributes to create in Brevo. Errors are returned as codes; the form
// shows the message in the visitor's language.

const BREVO_API = process.env.BREVO_API_URL || "https://api.brevo.com/v3"; // override only for local tests
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
const SOURCES = ["hero", "final", "calc"];
const LOCALES = ["pt-BR", "en"];
const LANDINGS = ["ai", "freelancers", "calc_take_home", "calc_company", "calc_carne_leao"];
const WORK_TYPES = ["ai", "freelancer", "teacher", "creator", "other"];
const RECEIVE_AS = ["pf", "cnpj", "unknown"];
const INCOME_RANGES = ["upTo5k", "from5to10k", "from10to20k", "over20k", "noAnswer"];

type Body = {
  email?: unknown;
  consent?: unknown;
  source?: unknown;
  locale?: unknown;
  landing?: unknown;
  work?: unknown;
  receiveAs?: unknown;
  income?: unknown;
  website?: unknown;
  utm?: unknown;
};

function reply(status: number, data: Record<string, unknown>) {
  return Response.json(data, { status });
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return reply(400, { ok: false, code: "generic" });
  }

  // Honeypot filled: pretend it worked so bots don't retry.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return reply(200, { ok: true });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return reply(400, { ok: false, code: "invalid_email" });
  }
  if (body.consent !== true) {
    return reply(400, { ok: false, code: "consent_required" });
  }

  const source = typeof body.source === "string" && SOURCES.includes(body.source) ? body.source : "site";
  const locale = typeof body.locale === "string" && LOCALES.includes(body.locale) ? body.locale : "pt-BR";
  const pick = (value: unknown, allowed: string[]) => (typeof value === "string" && allowed.includes(value) ? value : "");
  const landing = pick(body.landing, LANDINGS) || "ai";
  const work = pick(body.work, WORK_TYPES); // optional answer to "O que você faz?"
  const receiveAs = pick(body.receiveAs, RECEIVE_AS); // optional: PF or CNPJ (freelancer page, calculators)
  const income = pick(body.income, INCOME_RANGES); // optional: monthly income range
  const utm = body.utm && typeof body.utm === "object" ? (body.utm as Record<string, unknown>) : {};

  // LGPD: keep a record of when and where consent was given.
  const attributes: Record<string, string> = {
    SIGNUP_SOURCE: source,
    CONSENT_AT: new Date().toISOString(),
    LANGUAGE: locale,
    LANDING_PAGE: landing,
  };
  if (work) attributes.WORK_TYPE = work;
  if (receiveAs) attributes.RECEIVE_AS = receiveAs;
  if (income) attributes.INCOME_RANGE = income;
  for (const key of UTM_KEYS) {
    const value = utm[key];
    if (typeof value === "string" && value) attributes[key.toUpperCase()] = value.slice(0, 200);
  }

  const apiKey = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_LIST_ID);
  if (!apiKey || !listId) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[subscribe] BREVO_API_KEY/BREVO_LIST_ID not set; signup not saved:", email, attributes);
      return reply(200, { ok: true, dev: true });
    }
    console.error("[subscribe] BREVO_API_KEY/BREVO_LIST_ID missing in production");
    return reply(500, { ok: false, code: "generic" });
  }

  // Double opt-in is used when a Brevo confirmation template is configured. English signups
  // get the English template when one is set, otherwise the Portuguese one.
  const doiTemplateId = Number(
    (locale === "en" && process.env.BREVO_DOI_TEMPLATE_ID_EN) || process.env.BREVO_DOI_TEMPLATE_ID,
  );
  const doiRedirect = process.env.BREVO_DOI_REDIRECT_URL;
  const doubleOptIn = Boolean(doiTemplateId && doiRedirect);

  const send = (attrs: Record<string, string>) =>
    fetch(`${BREVO_API}/contacts${doubleOptIn ? "/doubleOptinConfirmation" : ""}`, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(
        doubleOptIn
          ? { email, attributes: attrs, includeListIds: [listId], templateId: doiTemplateId, redirectionUrl: doiRedirect }
          : { email, attributes: attrs, listIds: [listId], updateEnabled: true },
      ),
      signal: AbortSignal.timeout(8000),
    });

  try {
    let res = await send(attributes);
    // If an attribute is missing in Brevo, still save the email rather than lose the signup.
    if (res.status === 400) {
      console.error("[subscribe] Brevo rejected attributes, retrying without them:", await res.text());
      res = await send({});
    }
    if (!res.ok) {
      console.error("[subscribe] Brevo error", res.status, await res.text());
      return reply(502, { ok: false, code: "generic" });
    }
    return reply(200, { ok: true, doubleOptIn });
  } catch (err) {
    console.error("[subscribe] Brevo request failed", err);
    return reply(502, { ok: false, code: "generic" });
  }
}
