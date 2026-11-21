import { describe, expect, it } from "vitest";
import { DEFAULT_RITM_SETTINGS } from "@/lib/data/persona";
import { SCENARIO } from "@/lib/data/scenario";
import { monthSummary, raiseSavingPlan } from "./index";

const ritmOn = { ...DEFAULT_RITM_SETTINGS, enabled: true };

describe("monthSummary", () => {
  it("day 30: reached payday with 130 of 2.120 lei spending money left", () => {
    const s = monthSummary(SCENARIO, ritmOn, 30);
    expect(s.reachedPayday).toBe(true);
    expect(s.pool).toBe(2120);
    expect(s.spent).toBe(1990);
    expect(s.leftOfSpendingMoney).toBe(130);
    expect(s.overspent).toBe(0);
  });

  it("one pace point per day, and the fastest day is the day-6 spike", () => {
    const s = monthSummary(SCENARIO, ritmOn, 30);
    expect(s.points).toHaveLength(30);
    expect(s.points[5]).toMatchObject({ day: 6, severity: "spike" });
    expect(s.points[29].pctMonthPassed).toBe(1);
    expect(s.peak?.day).toBe(6);
    expect(s.daysOnPace).toBeGreaterThan(0);
    expect(s.daysOnPace).toBeLessThan(30);
  });

  it("works mid-month too, and clamps the day", () => {
    expect(monthSummary(SCENARIO, ritmOn, 6)).toMatchObject({ day: 6, reachedPayday: false, spent: 1166 });
    expect(monthSummary(SCENARIO, ritmOn, 99).day).toBe(30);
  });

  it("no peak before 20% of the money is spent", () => {
    expect(monthSummary(SCENARIO, ritmOn, 2).peak).toBeNull();
  });
});

describe("raiseSavingPlan", () => {
  it("saves half of a raise", () => {
    expect(raiseSavingPlan(500)).toEqual({ saved: 250, kept: 250 });
    expect(raiseSavingPlan(301)).toEqual({ saved: 151, kept: 150 });
    expect(raiseSavingPlan(-10)).toEqual({ saved: 0, kept: 0 });
  });
});
