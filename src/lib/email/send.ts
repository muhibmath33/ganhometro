// Sends the app's own emails (reminders, alerts, the weekly summary). Sign-in emails go through Supabase.
// Production: Resend (RESEND_API_KEY). Local: the Supabase CLI's Mailpit inbox (MAILPIT_URL). Neither: the
// message is only logged.
import "server-only";

export type Email = { to: string; subject: string; html: string; text: string };

const FROM = process.env.EMAIL_FROM || "Ganhômetro <nao-responda@ganhometro.com.br>";

export async function sendEmail(email: Email): Promise<{ ok: boolean; error?: string }> {
  try {
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "content-type": "application/json" },
        body: JSON.stringify({ from: FROM, to: [email.to], subject: email.subject, html: email.html, text: email.text }),
        signal: AbortSignal.timeout(10_000),
      });
      return res.ok ? { ok: true } : { ok: false, error: `Resend ${res.status}: ${await res.text()}` };
    }
    const mailpit = process.env.MAILPIT_URL;
    if (mailpit) {
      const [, name = "", address = FROM] = /^(.*?)\s*<(.+)>$/.exec(FROM) ?? [];
      const res = await fetch(`${mailpit}/api/v1/send`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ From: { Email: address, Name: name }, To: [{ Email: email.to }], Subject: email.subject, HTML: email.html, Text: email.text }),
        signal: AbortSignal.timeout(10_000),
      });
      return res.ok ? { ok: true } : { ok: false, error: `Mailpit ${res.status}` };
    }
    console.info("[email] not sent (no RESEND_API_KEY or MAILPIT_URL):", email.to, email.subject);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
