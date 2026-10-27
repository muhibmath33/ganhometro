// Invoice PDF (English by default), with the period's timesheet attached when horas=1: ?lang=en&horas=1
import { createElement } from "react";
import { parseDocLang } from "@/i18n/documents";
import { loadInvoices } from "@/lib/app/invoices";
import { isPro, requireUser } from "@/lib/app/session";
import { dayKey } from "@/lib/app/time";
import { fileName } from "@/lib/documents/format";
import { holderOf, loadTimesheet } from "@/lib/documents/load";
import { InvoicePdf, pdfResponse } from "@/lib/documents/pdf";

export async function GET(request: Request, { params }: RouteContext<"/app/arquivos/fatura/[id]">) {
  const { id } = await params;
  const { supabase, profile, user } = await requireUser();
  // Documents are Pro.
  if (!isPro(profile)) return Response.redirect(new URL("/app/plano", request.url), 303);
  const search = new URL(request.url).searchParams;
  const lang = parseDocLang(search.get("lang"), "en");
  const now = Date.now();
  const tz = profile.timezone;
  const today = dayKey(new Date(now), tz);
  const invoice = (await loadInvoices(supabase, user.id, today)).find((i) => i.id === id);
  if (!invoice) return new Response("Not found", { status: 404 });

  // The period's paid hours (for the description) and, if asked, the timesheet pages.
  const period = invoice.period_start && invoice.period_end ? { fromDay: invoice.period_start, toDay: invoice.period_end } : null;
  const sheet = period
    ? await loadTimesheet(supabase, user.id, tz, { sourceId: invoice.source_id, projectId: invoice.project_id, ...period, paidOnly: true }, lang, now)
    : null;
  const { data: source } = await supabase.from("income_sources").select("name, billing_details").eq("user_id", user.id).eq("id", invoice.source_id).maybeSingle();
  const worker = holderOf(profile);

  return pdfResponse(
    createElement(InvoicePdf, {
      lang,
      generatedOn: today,
      invoice,
      from: worker,
      billTo: { name: source?.name ?? invoice.sourceName, details: source?.billing_details ?? null },
      payTo: profile.payment_instructions,
      hours: sheet ? sheet.sheet.paidHours : null,
      timesheet:
        sheet && period && search.get("horas") === "1"
          ? {
              lang,
              worker,
              client: sheet.source.name,
              project: sheet.project?.name ?? null,
              ...period,
              generatedOn: today,
              sheet: sheet.sheet,
              paidOnly: true,
            }
          : undefined,
    }),
    fileName(lang === "en" ? "invoice" : "fatura", invoice.number) + ".pdf",
  );
}
