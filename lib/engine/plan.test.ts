import { describe, expect, it } from "vitest";
import { DEFAULT_RITM_SETTINGS } from "@/lib/data/persona";
import { createLock, requestUnlockWithReason, resolveLock } from "./lock";
import { goalPlan, goalProgress, lockPreview, planEdit, unlockFacts } from "./plan";
import type { MonthPlan } from "./types";

const plan: MonthPlan = {
  netSalary: 4800,
  essentialsTotal: 2180,
  goal: { name: "Islanda 2027", amount: 9000 },
  saved: 0,
  unlockDay: 20,
};

describe("lockPreview", () => {
  it("day 1, Lock 500: 2.120 lei to spend, 70 a day, 500 + interest back on day 20", () => {
    const p = lockPreview(plan, 500, 1);
    expect(p.spendingMoney).toBe(2120);
    expect(p.perDay).toBe(70);
    expect(p.interest).toBe(0.94); // 500 × 4% × 19/365, minus 10% tax
    expect(p.backOnUnlockDay).toBe(500.94);
    expect(p.goalPct).toBeCloseTo(500 / 9000);
    expect(p.tight).toBe(false);
  });

  it("a bigger Lock lowers the daily amount", () => {
    expect(lockPreview(plan, 800, 1).perDay).toBe(60);
  });

  it("under 30 lei a day is tight", () => {
    const p = lockPreview(plan, 1800, 1); // 820 lei ÷ 30 days
    expect(p.perDay).toBe(27);
    expect(p.tight).toBe(true);
  });

  it("later in the month the daily amount uses the days left; no interest after the unlock day", () => {
    const p = lockPreview(plan, 500, 25);
    expect(p.perDay).toBe(353); // 2120 ÷ 6
    expect(p.interest).toBe(0);
  });

  it("goal progress never goes over 100%", () => {
    expect(lockPreview({ ...plan, saved: 8800 }, 500, 1).goalPct).toBe(1);
  });
});

describe("goalPlan", () => {
  it("9.000 lei in 18 months needs 500 a month: the default Lock covers it", () => {
    expect(goalPlan({ amount: 9000, saved: 0, monthsLeft: 18 }, 500)).toEqual({ neededPerMonth: 500, fitsLock: true, monthsWithLock: 18 });
  });

  it("too soon for the Lock: shows the months the Lock takes instead", () => {
    expect(goalPlan({ amount: 9000, saved: 1000, monthsLeft: 6 }, 500)).toEqual({ neededPerMonth: 1334, fitsLock: false, monthsWithLock: 16 });
  });

  it("no Lock: no date can be promised", () => {
    expect(goalPlan({ amount: 9000, saved: 0, monthsLeft: 12 }, 0).monthsWithLock).toBeNull();
  });

  it("goal already reached", () => {
    expect(goalPlan({ amount: 9000, saved: 9500, monthsLeft: 12 }, 500)).toEqual({ neededPerMonth: 0, fitsLock: true, monthsWithLock: 0 });
  });
});

describe("requestUnlockWithReason (the mirror)", () => {
  const lock = createLock(500, 20);

  it("health, 300 lei, first time: released now through the emergency release", () => {
    const d = requestUnlockWithReason(lock, 8, { amount: 300, reason: "health" });
    expect(d.ok && d.path).toBe("emergency");
    if (d.ok && d.path === "emergency") {
      expect(d.released).toBe(300);
      expect(d.lock).toMatchObject({ status: "locked", amount: 200, emergencyUsed: true });
      expect(d.record).toEqual({ day: 8, amount: 300, reason: "health", path: "emergency" });
    }
  });

  it("'Something I want' always waits 24h, even under 300 lei", () => {
    const d = requestUnlockWithReason(lock, 8, { amount: 100, reason: "want", note: "  concert  " });
    expect(d.ok && d.path).toBe("wait");
    if (d.ok && d.path === "wait") {
      expect(d.releaseDay).toBe(9);
      expect(d.record).toEqual({ day: 8, amount: 100, reason: "want", note: "concert", path: "wait" });
      // Next day only the asked part comes out; the rest stays locked until day 20.
      expect(resolveLock(d.lock, 8).status).toBe("unlockRequested");
      expect(resolveLock(d.lock, 9)).toMatchObject({ status: "locked", amount: 400, unlockDay: 20 });
    }
  });

  it("over 300 lei waits 24h", () => {
    const d = requestUnlockWithReason(lock, 8, { amount: 400, reason: "bill" });
    expect(d.ok && d.path).toBe("wait");
  });

  it("the second emergency in a cycle waits 24h", () => {
    const first = requestUnlockWithReason(lock, 8, { amount: 100, reason: "unexpected" });
    if (!first.ok) throw new Error("first unlock failed");
    const second = requestUnlockWithReason(first.lock, 10, { amount: 100, reason: "health" });
    expect(second.ok && second.path).toBe("wait");
  });

  it("asking for the whole Lock unlocks it fully after 24h", () => {
    const d = requestUnlockWithReason(lock, 8, { amount: 500, reason: "want" });
    if (!d.ok) throw new Error("unlock failed");
    expect(resolveLock(d.lock, 9).status).toBe("unlocked");
  });

  it("refuses an amount over the Lock or a Lock that is already open", () => {
    expect(requestUnlockWithReason(lock, 8, { amount: 600, reason: "want" })).toEqual({ ok: false, reason: "invalidAmount" });
    expect(requestUnlockWithReason(lock, 8, { amount: 0, reason: "want" })).toEqual({ ok: false, reason: "invalidAmount" });
    expect(requestUnlockWithReason({ ...lock, status: "unlocked" }, 8, { amount: 100, reason: "want" })).toEqual({
      ok: false,
      reason: "notLocked",
    });
  });
});

describe("unlockFacts", () => {
  it("shows goal progress before → after and the unlock number", () => {
    const f = unlockFacts({ amount: 300, saved: 3060, goalAmount: 9000, unlocksThisCycle: 1 });
    expect(Math.round(f.goalPctBefore * 100)).toBe(34);
    expect(Math.round(f.goalPctAfter * 100)).toBe(31);
    expect(f.unlockNumber).toBe(2);
    expect(goalProgress(-50, 9000)).toBe(0);
  });
});

describe("planEdit", () => {
  const old = { ...DEFAULT_RITM_SETTINGS, enabled: true };

  it("a bigger Lock or a new goal applies now", () => {
    const next = { ...old, lock: { amount: 800, unlockDay: 20 }, goal: { name: "Laptop", amount: 6000 } };
    expect(planEdit(old, next, 5)).toEqual({ kind: "applied", settings: next });
  });

  it("a smaller Lock keeps the old Lock and asks for the reason screen", () => {
    const next = { ...old, lock: { amount: 300, unlockDay: 20 }, goal: { name: "Laptop", amount: 6000 } };
    const r = planEdit(old, next, 5);
    expect(r.kind).toBe("needsUnlock");
    if (r.kind === "needsUnlock") {
      expect(r.lockDecrease).toBe(200);
      expect(r.settings.lock).toEqual({ amount: 500, unlockDay: 20 });
      expect(r.settings.goal.name).toBe("Laptop"); // the safe part applies anyway
    }
  });

  it("an earlier unlock day also needs the reason screen", () => {
    const r = planEdit(old, { ...old, lock: { amount: 500, unlockDay: 10 } }, 5);
    expect(r.kind).toBe("needsUnlock");
    if (r.kind === "needsUnlock") {
      expect(r.lockDecrease).toBe(0);
      expect(r.requestedUnlockDay).toBe(10);
      expect(r.settings.lock.unlockDay).toBe(20);
    }
  });
});
