import assert from "node:assert/strict";
import { test } from "node:test";
import { entryHours, projectRate, type RateEntry, summarize, summarizeSource } from "./realRate.ts";

const at = (h: number) => new Date(Date.UTC(2026, 9, 27, h)).toISOString();
const entry = (kind: RateEntry["kind"], from: number, to: number | null, units: number | null = null): RateEntry => ({
  kind,
  started_at: at(from),
  ended_at: to === null ? null : at(to),
  units,
});
const NOW = Date.UTC(2026, 9, 27, 23);
const close = (a: number | null, b: number) => assert.ok(a !== null && Math.abs(a - b) < 1e-9, `${a} ≈ ${b}`);

test("landing page example: US$ 25/h, 8 h paid + 6 h unpaid → 43% less", () => {
  const s = summarize({ pay_model: "hourly", rate: 25, commission_pct: null }, [entry("paid", 0, 8), entry("unpaid", 8, 14)], NOW);
  close(s.earned, 200);
  close(s.realRate, 200 / 14);
  assert.equal(Math.round(s.gap! * 100), 43);
  assert.equal(Math.round(s.unpaidShare! * 100), 43);
  assert.equal(s.missing, null);
});

test("commission comes off the earnings", () => {
  const s = summarize({ pay_model: "hourly", rate: 20, commission_pct: 20 }, [entry("paid", 0, 10)], NOW);
  close(s.earned, 160);
  close(s.realRate, 16);
  close(s.gap, 0.2);
});

test("per task: tasks × rate, over all hours", () => {
  const s = summarize({ pay_model: "per_task", rate: 2, commission_pct: null }, [entry("paid", 0, 2, 30), entry("unpaid", 2, 3)], NOW);
  close(s.earned, 60);
  close(s.realRate, 20);
  close(s.paidRate, 30);
  assert.equal(s.gap, null);
});

test("per task without a task count can't be estimated", () => {
  const s = summarize({ pay_model: "per_task", rate: 2, commission_pct: null }, [entry("paid", 0, 2)], NOW);
  assert.equal(s.earned, null);
  assert.equal(s.missing, "units");
  close(s.hours, 2);
});

test("fixed price waits for the payment", () => {
  const s = summarize({ pay_model: "fixed", rate: null, commission_pct: null }, [entry("paid", 0, 2)], NOW);
  assert.equal(s.earned, null);
  assert.equal(s.missing, "fixed");
});

test("a running entry counts up to now", () => {
  close(entryHours(entry("paid", 20, null), NOW), 3);
});

test("entries are clipped to the period start", () => {
  close(entryHours(entry("paid", 2, 6), NOW, Date.parse(at(4))), 2);
  close(entryHours(entry("paid", 0, 2), NOW, Date.parse(at(4))), 0);
});

test("no hours: no rate, no share", () => {
  const s = summarize({ pay_model: "hourly", rate: 25, commission_pct: null }, [], NOW);
  assert.equal(s.realRate, null);
  assert.equal(s.unpaidShare, null);
  assert.equal(s.earned, 0);
});

test("retainer: the monthly amount for the share of a month the period lasts", () => {
  const from = Date.UTC(2026, 9, 1);
  const now = from + 30.4375 * 24 * 3_600_000; // exactly one average month later
  const s = summarize({ pay_model: "retainer", rate: 2000, commission_pct: null }, [entry("paid", 0, 10), entry("unpaid", 10, 15)], now, from);
  close(s.earned, 2000);
  close(s.realRate, 2000 / 15);
  assert.equal(s.gap, null);
});

test("projects: own hourly rate, and a fixed price spread over all its hours", () => {
  const source = { pay_model: "hourly" as const, rate: 20, commission_pct: null };
  const projects = [
    { id: "p1", pay_model: "hourly" as const, rate: 40, fixed_price: null, lifetimeHours: 0 },
    { id: "p2", pay_model: "fixed" as const, rate: null, fixed_price: 1000, lifetimeHours: 20 },
  ];
  const entries = [
    { ...entry("paid", 0, 2), project_id: null }, // 2 h at the client's 20 → 40
    { ...entry("paid", 2, 4), project_id: "p1" }, // 2 h at 40 → 80
    { ...entry("paid", 4, 9), project_id: "p2" }, // 5 of the project's 20 h → 1.000 × 5/20 = 250
  ];
  const s = summarizeSource(source, projects, entries, NOW);
  close(s.earned, 40 + 80 + 250);
  close(s.hours, 9);
  assert.equal(s.gap, null); // not comparable with the client's US$ 20/h
});

test("a fixed-price project's real rate: what was received, else the price, over every hour", () => {
  const source = { pay_model: "hourly" as const, rate: 20, commission_pct: 10 };
  const project = { id: "p", pay_model: "fixed" as const, rate: null, fixed_price: 1500, lifetimeHours: 0 };
  const all = [entry("paid", 0, 15), entry("unpaid", 15, 21)]; // 21 h, all before NOW
  const ctx = { periodEntries: [], allEntries: all, now: NOW, from: -Infinity };
  close(projectRate(source, project, { ...ctx, received: 0 }).realRate, (1500 * 0.9) / 21);
  const paid = projectRate(source, project, { ...ctx, received: 1200 });
  close(paid.realRate, (1200 * 0.9) / 21);
  assert.equal(paid.basis, "received");
});
