import { describe, expect, it } from "vitest";
import type { Transaction } from "@/lib/engine/types";
import { ESSENTIAL_CATEGORIES, ESSENTIALS_TOTAL, SPENDING_POOL } from "./persona";
import { dayToDate, SCENARIO, transactionsUntil } from "./scenario";

/** Simple local count (the real rules live in lib/engine, C4). */
const NEVER_COUNTED = new Set(["salary", "own_transfer", "savings", "pension", ...ESSENTIAL_CATEGORIES]);
const counted = (t: Transaction) => t.amount > 0 && !t.planned && !NEVER_COUNTED.has(t.category);
const spentUntil = (day: number) => transactionsUntil(day).filter(counted).reduce((s, t) => s + t.amount, 0);

describe("persona", () => {
  it("spending money is 2120 lei", () => {
    expect(ESSENTIALS_TOTAL).toBe(2180);
    expect(SPENDING_POOL).toBe(2120);
  });
});

describe("scenario", () => {
  it("has unique ids and days 1–30", () => {
    expect(new Set(SCENARIO.map((t) => t.id)).size).toBe(SCENARIO.length);
    expect(SCENARIO.every((t) => t.day >= 1 && t.day <= 30)).toBe(true);
  });

  it("stays under 20% on days 1–2", () => {
    expect(spentUntil(2) / SPENDING_POOL).toBeLessThan(0.2);
  });

  it("reaches about 55% by the end of day 6", () => {
    expect(spentUntil(6)).toBe(1166);
    expect(spentUntil(6) / SPENDING_POOL).toBeCloseTo(0.55, 2);
  });

  it("does not run out before payday after calming down", () => {
    expect(spentUntil(30)).toBeLessThan(SPENDING_POOL);
  });

  it("includes one planned purchase and one refund, both not counted", () => {
    const planned = SCENARIO.filter((t) => t.planned);
    const refunds = SCENARIO.filter((t) => t.amount < 0 && t.category !== "salary");
    expect(planned).toHaveLength(1);
    expect(refunds).toHaveLength(1);
    expect([...planned, ...refunds].some(counted)).toBe(false);
  });

  it("transactionsUntil only returns days up to the given day", () => {
    expect(transactionsUntil(3).every((t) => t.day <= 3)).toBe(true);
  });

  it("dayToDate maps day N to the Nth of the month", () => {
    const d = dayToDate(6, new Date(2026, 10, 21));
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 10, 6]);
  });
});
