import { describe, expect, it } from "vitest";
import { DEFAULT_RITM_SETTINGS } from "@/lib/data/persona";
import { SCENARIO, SCENARIO_MONTH_2 } from "@/lib/data/scenario";
import { computePace } from "./pace";
import { detectHabits, habitNote, isHabit, lockSuggestion } from "./habits";
import { usualDailySpend } from "./pace";
import type { RitmSettings, Transaction } from "./types";

const settings: RitmSettings = { ...DEFAULT_RITM_SETTINGS, enabled: true, lock: { amount: 500, unlockDay: 20 } };

describe("habits (section 11 F)", () => {
  it("finds a merchant seen in 3 of the last 4 weeks at a similar amount", () => {
    const habits = detectHabits(SCENARIO_MONTH_2, SCENARIO, settings, 6);
    expect(habits.map((h) => h.merchant).sort()).toEqual(["Cafeneaua Nord", "FoodGo", "Mega Coș"]);
    expect(habits.find((h) => h.merchant === "Cafeneaua Nord")?.typical).toBe(12);
  });

  it("a one-off isn't a habit, and an unusual amount at a habit merchant isn't the habit", () => {
    const habits = detectHabits(SCENARIO_MONTH_2, SCENARIO, settings, 6);
    expect(habits.some((h) => h.merchant === "StilNou" || h.merchant === "Bar Nocturn")).toBe(false);
    const big: Transaction = { id: "x", day: 6, amount: 120, merchant: "Mega Coș", category: "groceries", channel: "card_in_store" };
    expect(isHabit(big, habits)).toBe(false);
  });

  it("is deterministic: the same history gives the same answer", () => {
    expect(detectHabits(SCENARIO_MONTH_2, SCENARIO, settings, 6)).toEqual(detectHabits(SCENARIO_MONTH_2, SCENARIO, settings, 6));
  });

  it("month 1 has no history, so no personal pace and no habit note", () => {
    const pace = computePace(SCENARIO, settings, 6);
    expect(pace.personal).toBe(false);
    expect(habitNote(pace, SCENARIO, [], settings, 6).soft).toBe(false);
  });

  it("from month 2 the pace is measured against the user's usual day", () => {
    const usual = usualDailySpend(SCENARIO, settings);
    expect(Math.round(usual)).toBe(66);
    const pace = computePace(SCENARIO_MONTH_2, settings, 6, SCENARIO);
    expect(pace.personal).toBe(true);
    expect(pace.paceRatio).toBeCloseTo(pace.spent / (usual * 6), 5);
  });

  it("day 6 of month 2: above the usual pace, mostly habits, money lasts → the soft note", () => {
    const pace = computePace(SCENARIO_MONTH_2, settings, 6, SCENARIO);
    expect(pace.severity).toBe("watch");
    expect(pace.projectedRunOutDay).toBeNull();
    const note = habitNote(pace, SCENARIO_MONTH_2, SCENARIO, settings, 6);
    expect(note.soft).toBe(true);
    expect(note.merchants[0]).toBe("Mega Coș");
  });

  it("the same spending without habits behind it gets the normal Heads-up", () => {
    // Swap the habit purchases for one-off shops: same lei, not habits.
    const noHabits = SCENARIO_MONTH_2.map((t) => (t.merchant === "Mega Coș" ? { ...t, merchant: `Shop ${t.id}` } : t));
    const pace = computePace(noHabits, settings, 6, SCENARIO);
    expect(habitNote(pace, noHabits, SCENARIO, settings, 6).soft).toBe(false);
  });

  it("suggests a Lock that fits real spending: salary − essentials − last month, down to 50", () => {
    // 4.800 − 2.180 − 1.990 = 630 → 600.
    expect(lockSuggestion(SCENARIO, settings, 4800)).toBe(600);
  });
});
