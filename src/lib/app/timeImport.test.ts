import assert from "node:assert/strict";
import { test } from "node:test";
import { groupOf, parseClock, readTimesheet } from "./timeImport.ts";

test("clock times in the formats the tools export", () => {
  assert.equal(parseClock("09:00:00"), "09:00");
  assert.equal(parseClock("9:05"), "09:05");
  assert.equal(parseClock("09:00 AM"), "09:00");
  assert.equal(parseClock("12:30:00 AM"), "00:30");
  assert.equal(parseClock("1:15:00 PM"), "13:15");
  assert.equal(parseClock("21h05"), "21:05");
  assert.equal(parseClock("25:00"), null);
});

test("Toggl detailed report: times, client, billable; descriptions ignored", () => {
  const csv = [
    "User,Email,Client,Project,Task,Description,Billable,Start date,Start time,End date,End time,Duration,Tags,Amount (USD)",
    'Ana,ana@x.com,ACME,Site,,"Secret task, do not store",Yes,2026-10-05,09:00:00,2026-10-05,11:30:00,02:30:00,,',
    "Ana,ana@x.com,,Prospecting,,Proposals,No,2026-10-05,23:00:00,2026-10-06,00:30:00,01:30:00,,",
    "Ana,ana@x.com,ACME,Site,,dup,Yes,2026-10-05,09:00:00,2026-10-05,11:30:00,02:30:00,,", // same entry again
    "Ana,ana@x.com,ACME,Site,,bad,Yes,2026-10-07,10:00:00,2026-10-07,10:00:00,00:00:00,,", // zero length
  ].join("\n");
  const r = readTimesheet(csv, { dayFirst: true });
  assert.equal(r.format, "toggl");
  assert.equal(r.rows.length, 2);
  assert.equal(r.skipped, 2);
  assert.deepEqual(
    r.rows.map((x) => [x.startDay, x.startTime, x.endDay, x.endTime, x.client, x.project, x.billable, x.minutes]),
    [
      ["2026-10-05", "09:00", "2026-10-05", "11:30", "ACME", "Site", true, 150],
      ["2026-10-05", "23:00", "2026-10-06", "00:30", "", "Prospecting", false, 90],
    ],
  );
  assert.ok(!JSON.stringify(r.rows).includes("Secret"));
  assert.equal(groupOf(r.rows[0]), "ACME");
  assert.equal(groupOf(r.rows[1]), "Prospecting");
  assert.ok(r.rows[0].ref.startsWith("toggl:"));
});

test("Clockify detailed report with US dates and 12-hour times", () => {
  const csv = [
    "Project,Client,Description,Task,User,Group,Email,Tags,Billable,Start Date,Start Time,End Date,End Time,Duration (h),Duration (decimal),Billable Rate (USD),Billable Amount (USD)",
    "Logo,Beta LLC,Sketches,,Ana,,ana@x.com,,Yes,10/15/2026,01:00:00 PM,10/15/2026,03:15:00 PM,02:15:00,2.25,40,90",
  ].join("\n");
  const r = readTimesheet(csv, { dayFirst: true });
  assert.equal(r.format, "clockify");
  assert.equal(r.ambiguousDates, false); // 15 can't be a month
  assert.deepEqual([r.rows[0].startDay, r.rows[0].startTime, r.rows[0].endTime, r.rows[0].minutes], ["2026-10-15", "13:00", "15:15", 135]);
});

test("ambiguous dates follow the chosen order; Portuguese headers", () => {
  const csv = [
    "Projeto;Cliente;Descrição;Faturável;Data de início;Hora de início;Data de término;Hora de término",
    "Site;ACME;x;Sim;05/10/2026;09:00;05/10/2026;10:00",
  ].join("\n");
  const dayFirst = readTimesheet(csv, { dayFirst: true });
  assert.equal(dayFirst.ambiguousDates, true);
  assert.equal(dayFirst.rows[0].startDay, "2026-10-05");
  assert.equal(dayFirst.rows[0].billable, true);
  assert.equal(readTimesheet(csv, { dayFirst: false }).rows[0].startDay, "2026-05-10");
});

test("a file without start and end columns gives nothing", () => {
  const r = readTimesheet("Date,Amount\n2026-10-01,10", { dayFirst: true });
  assert.equal(r.rows.length, 0);
});
