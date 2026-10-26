// The PDFs (sprint 7): income report, timesheet (also the payment review pack), and invoice. Rendered on the
// server with @react-pdf/renderer; Helvetica covers Portuguese accents.
import "server-only";
import { Document, Page, renderToBuffer, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { type DocDictionary, type DocLang, getDocDictionary } from "@/i18n/documents";
import { fill } from "@/i18n/config";
import type { incomeReport, ReportPayment, timesheetRows } from "@/lib/money/reports";
import { docDate, docHours, docMoney, docMonth, docPeriod, docRate } from "./format";

const C = { ink: "#13201B", soft: "#3E4A45", muted: "#5C6762", line: "#E4E0D5", brand: "#0B6B4F", paper: "#F6F4EE", amber: "#8A4B0B" };

const s = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 56, paddingHorizontal: 44, fontFamily: "Helvetica", fontSize: 9.5, color: C.ink, lineHeight: 1.35 },
  // Larger text sets its own line height: the page's would be too tight for it.
  title: { fontFamily: "Helvetica-Bold", fontSize: 20, lineHeight: 1.2, marginBottom: 4 },
  subtitle: { fontSize: 11, lineHeight: 1.3, color: C.soft, marginBottom: 16 },
  h2: { fontFamily: "Helvetica-Bold", fontSize: 11.5, lineHeight: 1.3, marginTop: 16, marginBottom: 6 },
  label: { fontSize: 8, color: C.muted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 2 },
  bold: { fontFamily: "Helvetica-Bold" },
  soft: { color: C.soft },
  muted: { color: C.muted },
  row: { flexDirection: "row" },
  box: { borderWidth: 1, borderColor: C.line, borderRadius: 6, padding: 10 },
  tableHead: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.ink, paddingBottom: 3, marginBottom: 2 },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: C.line, paddingVertical: 3 },
  th: { fontFamily: "Helvetica-Bold", fontSize: 8.5 },
  right: { textAlign: "right" },
  note: { fontSize: 8, color: C.muted, marginTop: 3 },
  // Positioned from the top: with "bottom", the page number (rendered per page) lands outside the page.
  footer: { position: "absolute", top: 806, left: 44, right: 44, fontSize: 7.5, lineHeight: 1.3, color: C.muted },
  stamp: { position: "absolute", top: 40, right: 44, fontFamily: "Helvetica-Bold", fontSize: 14, lineHeight: 1.2, color: C.brand, borderWidth: 2, borderColor: C.brand, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
});

export type Party = { name: string | null; details: string | null };

function Footer({ t, generatedOn, lang }: { t: DocDictionary; generatedOn: string; lang: DocLang }) {
  return (
    <>
      <Text style={[s.footer, { right: 130 }]} fixed>
        {fill(t.common.generated, { date: docDate(generatedOn, lang) })}
      </Text>
      <Text style={[s.footer, s.right]} fixed render={({ pageNumber, totalPages }) => fill(t.common.page, { n: pageNumber, total: totalPages })} />
    </>
  );
}

function PartyBlock({ label, party, t }: { label: string; party: Party; t: DocDictionary }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.bold}>{party.name || t.common.noName}</Text>
      {party.details ? <Text style={s.soft}>{party.details}</Text> : null}
    </View>
  );
}

// A table: columns with flex widths and alignment; rows never split across pages.
type Col = { label: string; flex: number; right?: boolean };
function Table({ cols, rows }: { cols: Col[]; rows: (string | ReactElement)[][] }) {
  return (
    <View>
      <View style={s.tableHead}>
        {cols.map((c, i) => (
          <Text key={i} style={[s.th, { flex: c.flex, paddingHorizontal: 3 }, c.right ? s.right : {}]}>
            {c.label}
          </Text>
        ))}
      </View>
      {rows.map((r, i) => (
        <View key={i} style={s.tableRow} wrap={false}>
          {r.map((cell, j) => (
            <Text key={j} style={[{ flex: cols[j].flex, paddingHorizontal: 3 }, cols[j].right ? s.right : {}]}>
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={[s.box, { flex: 1 }]}>
      <Text style={s.label}>{label}</Text>
      <Text style={[s.bold, { fontSize: 12, lineHeight: 1.3 }]}>{value}</Text>
    </View>
  );
}

// --- Income report -------------------------------------------------------------------------------------

export type IncomeRow = ReportPayment & { rate: number | null; rateDay: string | null };
export type IncomeReportProps = {
  lang: DocLang;
  holder: Party;
  fromKey: string;
  toKey: string;
  generatedOn: string;
  report: ReturnType<typeof incomeReport<IncomeRow>>;
  // The month's tax estimate and when it was paid, if the person tracks taxes (by "2026-10").
  taxes: Map<string, { amount: number; paidOn: string | null }> | null;
};

export function IncomeReportPdf({ lang, holder, fromKey, toKey, generatedOn, report, taxes }: IncomeReportProps) {
  const t = getDocDictionary(lang);
  const i = t.income;
  const brl = (n: number) => docMoney("BRL", n, lang);
  return (
    <Document title={`${i.title} ${fromKey} – ${toKey}`} author={holder.name ?? undefined} creator="Ganhômetro" producer="Ganhômetro">
      <Page size="A4" style={s.page}>
        <Text style={s.title}>{i.title}</Text>
        <Text style={s.subtitle}>{fill(i.subtitle, { from: docMonth(fromKey, lang), to: docMonth(toKey, lang) })}</Text>
        <View style={[s.row, { marginBottom: 14 }]}>
          <PartyBlock label={i.holder} party={holder} t={t} />
        </View>

        <View style={[s.row, { gap: 8 }]}>
          <Stat label={i.total} value={brl(report.total)} />
          <Stat label={i.average} value={brl(report.average)} />
          <Stat label={i.months} value={fill(i.monthsValue, { n: report.monthsWithIncome, total: report.months.length })} />
        </View>
        {report.sources.length > 0 && (
          <Text style={[s.soft, { marginTop: 8 }]}>
            <Text style={s.bold}>{i.sources}: </Text>
            {report.sources.join(", ")}
          </Text>
        )}

        <Text style={s.h2}>{i.byMonth}</Text>
        <Table
          cols={[
            { label: i.month, flex: 3 },
            { label: i.count, flex: 1.6, right: true },
            { label: i.inReais, flex: 2.2, right: true },
            ...(taxes ? [{ label: i.tax, flex: 2.6, right: true }, { label: i.paidOn, flex: 1.8, right: true }] : []),
          ]}
          rows={report.months.map((m) => {
            const tax = taxes?.get(m.key);
            return [
              docMonth(m.key, lang),
              String(m.count),
              brl(m.brl),
              ...(taxes ? [tax && tax.amount > 0 ? brl(tax.amount) : "—", tax?.paidOn ? docDate(tax.paidOn, lang) : "—"] : []),
            ];
          })}
        />

        <Text style={s.h2}>{i.details}</Text>
        {report.payments.length ? (
          <Table
            cols={[
              { label: i.date, flex: 1.6 },
              { label: i.source, flex: 3 },
              { label: i.original, flex: 2.2, right: true },
              { label: i.rate, flex: 2.6, right: true },
              { label: i.inReais, flex: 2.2, right: true },
            ]}
            rows={report.payments.map((p) => [
              docDate(p.received_on, lang),
              p.source,
              docMoney(p.currency, p.amount, lang),
              p.currency === "BRL" ? "—" : p.rate !== null && p.rateDay ? `${docRate(p.rate, lang)} (${docDate(p.rateDay, lang)})` : "—",
              p.brl === null ? "—" : brl(p.brl),
            ])}
          />
        ) : (
          <Text style={s.muted}>{i.empty}</Text>
        )}
        {report.missing > 0 && <Text style={[s.note, { color: C.amber }]}>{fill(i.missing, { n: report.missing })}</Text>}

        <View style={{ marginTop: 14 }} wrap={false}>
          {i.notes.map((n, k) => (
            <Text key={k} style={s.note}>
              {k + 1}. {n}
            </Text>
          ))}
        </View>
        <Footer t={t} generatedOn={generatedOn} lang={lang} />
      </Page>
    </Document>
  );
}

// --- Timesheet (and the payment review pack) ---------------------------------------------------------------

export type ReviewNumbers = { currency: string; rate: number | null; expected: number | null; received: number; difference: number | null };
export type TimesheetProps = {
  lang: DocLang;
  worker: Party;
  client: string;
  project: string | null;
  fromDay: string;
  toDay: string;
  generatedOn: string;
  sheet: ReturnType<typeof timesheetRows>;
  paidOnly: boolean;
  review?: ReviewNumbers;
};

function TimesheetPage(p: TimesheetProps) {
  const t = getDocDictionary(p.lang);
  const ts = t.timesheet;
  const hours = (h: number) => docHours(h, p.lang);
  return (
    <Page size="A4" style={s.page}>
      <Text style={s.title}>{p.review ? ts.reviewTitle : ts.title}</Text>
      <Text style={s.subtitle}>{docPeriod(t.common.period, p.fromDay, p.toDay, p.lang)}</Text>
      <View style={[s.row, { gap: 16, marginBottom: 12 }]}>
        <PartyBlock label={ts.worker} party={p.worker} t={t} />
        <View style={{ flex: 1 }}>
          <Text style={s.label}>{ts.client}</Text>
          <Text style={s.bold}>{p.client}</Text>
          {p.project && (
            <Text style={s.soft}>
              {ts.project}: {p.project}
            </Text>
          )}
        </View>
      </View>

      <View style={[s.row, { gap: 8 }]}>
        <Stat label={ts.paidHours} value={hours(p.sheet.paidHours)} />
        {!p.paidOnly && <Stat label={ts.unpaidHours} value={hours(p.sheet.unpaidHours)} />}
        {!p.paidOnly && <Stat label={ts.totalHours} value={hours(p.sheet.totalHours)} />}
      </View>

      {p.review && (
        <View style={[s.box, { marginTop: 10, backgroundColor: C.paper }]} wrap={false}>
          <Text style={[s.label, { marginBottom: 6 }]}>{ts.payment}</Text>
          {p.review.rate !== null && <Line label={ts.rate} value={`${docMoney(p.review.currency, p.review.rate, p.lang)}/h`} />}
          {p.review.expected !== null && <Line label={ts.expected} value={docMoney(p.review.currency, p.review.expected, p.lang)} />}
          <Line label={ts.received} value={docMoney(p.review.currency, p.review.received, p.lang)} />
          {p.review.difference !== null && <Line label={ts.difference} value={docMoney(p.review.currency, p.review.difference, p.lang)} bold />}
          <Text style={[s.note, { marginTop: 6 }]}>{ts.reviewNote}</Text>
        </View>
      )}

      <Text style={s.h2}>{p.paidOnly ? `${ts.title}: ${ts.onlyPaid}` : ts.title}</Text>
      {p.sheet.rows.length ? (
        <Table
          cols={[
            { label: ts.date, flex: 1.7 },
            { label: ts.start, flex: 1 },
            { label: ts.end, flex: 1 },
            { label: ts.duration, flex: 1.2, right: true },
            ...(p.paidOnly ? [] : [{ label: ts.kind, flex: 1.2 }]),
            { label: ts.activity, flex: 2.6 },
          ]}
          rows={p.sheet.rows.map((r) => [
            docDate(r.day, p.lang),
            r.start,
            r.end ?? ts.running,
            hours(r.hours),
            ...(p.paidOnly ? [] : [ts.kinds[r.kind]]),
            r.label ?? "",
          ])}
        />
      ) : (
        <Text style={s.muted}>{ts.empty}</Text>
      )}
      <Footer t={t} generatedOn={p.generatedOn} lang={p.lang} />
    </Page>
  );
}

function Line({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={[s.row, { justifyContent: "space-between", paddingVertical: 1.5 }]}>
      <Text style={bold ? s.bold : s.soft}>{label}</Text>
      <Text style={bold ? s.bold : {}}>{value}</Text>
    </View>
  );
}

export function TimesheetPdf(p: TimesheetProps) {
  const t = getDocDictionary(p.lang);
  return (
    <Document title={`${p.review ? t.timesheet.reviewTitle : t.timesheet.title}: ${p.client}`} creator="Ganhômetro" producer="Ganhômetro">
      <TimesheetPage {...p} />
    </Document>
  );
}

// --- Invoice ---------------------------------------------------------------------------------------------

export type InvoiceProps = {
  lang: DocLang;
  generatedOn: string;
  invoice: {
    number: string;
    issued_on: string;
    due_on: string;
    amount: number;
    currency: string;
    paid: number;
    balance: number;
    state: string;
    period_start: string | null;
    period_end: string | null;
    projectName: string | null;
  };
  from: Party;
  billTo: Party;
  payTo: string | null;
  hours: number | null; // paid hours logged in the period, when it has one
  timesheet?: TimesheetProps;
};

export function InvoicePdf({ lang, generatedOn, invoice, from, billTo, payTo, hours, timesheet }: InvoiceProps) {
  const t = getDocDictionary(lang);
  const v = t.invoice;
  const money = (n: number) => docMoney(invoice.currency, n, lang);
  const stamp = invoice.state === "paid" ? v.status.paid : invoice.state === "void" ? v.status.void : invoice.state === "draft" ? v.status.draft : null;
  const description = [invoice.projectName ? `${v.services}: ${invoice.projectName}` : v.services];
  if (invoice.period_start && invoice.period_end)
    description.push(fill(v.period, { period: docPeriod(t.common.period, invoice.period_start, invoice.period_end, lang) }));
  if (hours !== null && hours > 0) description.push(fill(v.hours, { hours: docHours(hours, lang) }));

  return (
    <Document title={`${v.title} ${invoice.number}`} author={from.name ?? undefined} creator="Ganhômetro" producer="Ganhômetro">
      <Page size="A4" style={s.page}>
        {stamp && <Text style={s.stamp}>{stamp}</Text>}
        <Text style={[s.title, { fontSize: 24, color: C.brand }]}>{v.title}</Text>
        <View style={[s.row, { gap: 24, marginTop: 6, marginBottom: 22 }]}>
          <View>
            <Text style={s.label}>{v.number}</Text>
            <Text style={s.bold}>{invoice.number}</Text>
          </View>
          <View>
            <Text style={s.label}>{v.issued}</Text>
            <Text>{docDate(invoice.issued_on, lang)}</Text>
          </View>
          <View>
            <Text style={s.label}>{v.due}</Text>
            <Text style={s.bold}>{docDate(invoice.due_on, lang)}</Text>
          </View>
        </View>

        <View style={[s.row, { gap: 24, marginBottom: 22 }]}>
          <PartyBlock label={v.from} party={from} t={t} />
          <PartyBlock label={v.billTo} party={billTo} t={t} />
        </View>

        <Table
          cols={[
            { label: v.description, flex: 5 },
            { label: v.amount, flex: 2, right: true },
          ]}
          rows={[[description.join("\n"), money(invoice.amount)]]}
        />
        <View style={{ alignSelf: "flex-end", width: "45%", marginTop: 8 }}>
          <Line label={v.total} value={money(invoice.amount)} />
          {invoice.paid > 0 && <Line label={v.paid} value={`− ${money(invoice.paid)}`} />}
          <View style={{ borderTopWidth: 1, borderTopColor: C.ink, marginTop: 3, paddingTop: 3 }}>
            <Line label={v.balance} value={money(invoice.state === "void" ? 0 : invoice.balance)} bold />
          </View>
        </View>

        {payTo && (
          <View style={[s.box, { marginTop: 22 }]} wrap={false}>
            <Text style={s.label}>{v.payTo}</Text>
            <Text>{payTo}</Text>
          </View>
        )}
        {timesheet && <Text style={[s.note, { marginTop: 14 }]}>{v.timesheet}</Text>}
        <Text style={[s.soft, { marginTop: 18 }]}>{v.thanks}</Text>
        <Footer t={t} generatedOn={generatedOn} lang={lang} />
      </Page>
      {timesheet && <TimesheetPage {...timesheet} />}
    </Document>
  );
}

// A PDF download response.
export async function pdfResponse(element: ReactElement, filename: string): Promise<Response> {
  // renderToBuffer is typed for <Document> elements; the components above all return one.
  const buffer = await renderToBuffer(element as Parameters<typeof renderToBuffer>[0]);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
