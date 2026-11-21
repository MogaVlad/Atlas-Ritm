import { describe, expect, it } from "vitest";
import { DEFAULT_RITM_SETTINGS } from "@/lib/data/persona";
import { SCENARIO } from "@/lib/data/scenario";
import {
  alertActions,
  computePace,
  createLock,
  emergencyRelease,
  INITIAL_ALERT_MEMORY,
  interestEstimate,
  requestUnlock,
  resolveLock,
  shouldNotify,
  shouldShowSpeedBump,
  type RitmSettings,
  type Transaction,
} from "./index";

const settings: RitmSettings = { ...DEFAULT_RITM_SETTINGS, enabled: true };
const tx = [...SCENARIO];
const pace = (day: number, list: Transaction[] = tx, s: RitmSettings = settings) => computePace(list, s, day);

const jacket: Transaction = {
  id: "demo-jacket",
  day: 6,
  amount: 300,
  merchant: "ModaHub",
  category: "shopping",
  channel: "card_online",
};

describe("computePace", () => {
  it("spending money is 2120 lei", () => {
    expect(pace(1).pool).toBe(2120);
  });

  it("no alert on days 1–2", () => {
    for (const day of [1, 2]) {
      const state = pace(day);
      expect(state.severity).toBe("ok");
      expect(shouldNotify(state, INITIAL_ALERT_MEMORY, day)).toBe(false);
    }
  });

  it("spike on day 6, 55% spent, money runs out on day 10", () => {
    const state = pace(6);
    expect(state.spent).toBe(1166);
    expect(Math.round(state.pctSpent * 100)).toBe(55);
    expect(state.severity).toBe("spike");
    expect(state.projectedRunOutDay).toBe(10);
    expect(state.reasons.map((r) => r.key)).toContain("ritm.reason.runOut");
    expect(state.reasons.find((r) => r.key === "ritm.reason.runOut")?.values).toEqual({ day: 10, daysBefore: 20 });
  });

  it("rent and the planned purchase are not counted", () => {
    expect(pace(2).spent).toBe(300); // rent (1800 lei) on day 2 is not in there
    const shoes = tx.find((t) => t.planned)!;
    const withoutShoes = tx.filter((t) => t !== shoes);
    expect(pace(9).spent).toBe(pace(9, withoutShoes).spent);
  });

  it("the refund is not counted", () => {
    const refund = tx.find((t) => t.amount < 0 && t.category !== "salary")!;
    expect(pace(10).spent).toBe(pace(10, tx.filter((t) => t !== refund)).spent);
  });

  it("safe to spend falls after a big purchase", () => {
    // Day 7 is an ordinary day (on day 6 Andrei already spent 606 lei, so safe-to-spend is 0 there).
    const before = pace(7).safeToSpendToday;
    const after = pace(7, [...tx, { ...jacket, day: 7 }]).safeToSpendToday;
    expect(before).toBeGreaterThan(0);
    expect(after).toBeLessThan(before);
    expect(pace(6).safeToSpendToday).toBe(0);
  });

  it("a burst of 25% in 48h is a spike", () => {
    const burst: Transaction = { ...jacket, id: "burst", day: 2, amount: 600 };
    expect(pace(2, [...tx, burst]).severity).toBe("spike");
  });
});

describe("alerts", () => {
  it("notifies when the level rises, not again the next day, again after 48h", () => {
    const day6 = pace(6);
    expect(shouldNotify(day6, INITIAL_ALERT_MEMORY, 6)).toBe(true);
    const memory = { lastNotifiedDay: 6, lastSeverity: "spike" as const, ignoredCount: 0 };
    expect(shouldNotify(pace(7), memory, 7)).toBe(false);
    expect(shouldNotify(pace(8), memory, 8)).toBe(true);
  });

  it("suggests the Speed bump first after 2 ignored alerts", () => {
    const day6 = pace(6);
    expect(alertActions(day6, INITIAL_ALERT_MEMORY)[0].kind).toBe("moveToLock");
    expect(alertActions(day6, { ...INITIAL_ALERT_MEMORY, ignoredCount: 2 })[0].kind).toBe("enableSpeedBump");
  });

  it("offers nothing when the pace is ok", () => {
    expect(alertActions(pace(2), INITIAL_ALERT_MEMORY)).toEqual([]);
  });
});

describe("shouldShowSpeedBump", () => {
  const sb: RitmSettings = { ...settings, speedBump: true };
  const state = pace(6);

  it("pauses the 300-lei online jacket with the Speed bump on", () => {
    expect(shouldShowSpeedBump(jacket, sb, state)).toBe(true);
  });

  it("does not pause with the Speed bump off or Ritm off", () => {
    expect(shouldShowSpeedBump(jacket, settings, state)).toBe(false);
    expect(shouldShowSpeedBump(jacket, { ...sb, enabled: false }, state)).toBe(false);
  });

  it("does not pause in-store taps, planned, essential or small payments", () => {
    expect(shouldShowSpeedBump({ ...jacket, channel: "card_in_store" }, sb, state)).toBe(false);
    expect(shouldShowSpeedBump({ ...jacket, planned: true }, sb, state)).toBe(false);
    expect(shouldShowSpeedBump({ ...jacket, category: "utilities" }, sb, state)).toBe(false);
    expect(shouldShowSpeedBump({ ...jacket, amount: 99 }, sb, state)).toBe(false);
  });
});

describe("lock", () => {
  const lock = createLock(500, 20);

  it("unlocks automatically on the unlock day", () => {
    expect(resolveLock(lock, 19).status).toBe("locked");
    expect(resolveLock(lock, 20).status).toBe("unlocked");
  });

  it("early unlock is released 24h (one day) after the request", () => {
    const requested = requestUnlock(lock, 8);
    expect(requested.status).toBe("unlockRequested");
    expect(resolveLock(requested, 8).status).toBe("unlockRequested");
    expect(resolveLock(requested, 9).status).toBe("unlocked");
  });

  it("emergency release: up to 300 lei, refused a second time", () => {
    const first = emergencyRelease(lock, 300);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.lock.amount).toBe(200);
    expect(emergencyRelease(first.lock, 50)).toEqual({ ok: false, reason: "alreadyUsed" });
    expect(emergencyRelease(lock, 400)).toEqual({ ok: false, reason: "overLimit" });
  });

  it("interest estimate is net of 10% tax", () => {
    // 500 lei × 5% × 30/365 = 2.05 gross → 1.85 net
    expect(interestEstimate(500, 30, 0.05)).toBe(1.85);
    expect(interestEstimate(500, 0, 0.05)).toBe(0);
  });
});
