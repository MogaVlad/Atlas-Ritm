import { describe, expect, it } from "vitest";
import { DEFAULT_RITM_SETTINGS } from "@/lib/data/persona";
import { createLock, goalPlan, lockPreview, planEdit, requestUnlockWithReason, resolveLock, unlockMirror } from "@/lib/engine";

describe("lockPreview (section 11 B)", () => {
  it("shows per day, what comes back with interest, and goal share", () => {
    const p = lockPreview({
      spendingMoney: 2120,
      lockAmount: 500,
      unlockDay: 20,
      goalAmount: 9000,
    });
    expect(p.perDay).toBe(70.67);
    expect(p.backOnUnlock).toBe(500.94); // 500 + 500 × 4% × 19/365, minus 10% tax
    expect(p.goalPct).toBeCloseTo(500 / 9000);
    expect(p.tight).toBe(false);
  });

  it("flags under 30 lei a day as tight", () => {
    expect(
      lockPreview({
        spendingMoney: 800,
        lockAmount: 1400,
        unlockDay: 20,
        goalAmount: 9000,
      }).tight,
    ).toBe(true);
  });

  it("no Lock: nothing comes back, no goal share", () => {
    const p = lockPreview({
      spendingMoney: 2620,
      lockAmount: 0,
      unlockDay: 20,
      goalAmount: 9000,
    });
    expect(p.backOnUnlock).toBe(0);
    expect(p.goalPct).toBe(0);
  });
});

describe("unlockMirror (section 11 C)", () => {
  const lock = createLock(500, 20);
  const base = { lock, saved: 500, goalAmount: 1000 };

  it("health, bill or unexpected up to 300 lei: emergency, right away", () => {
    for (const reason of ["health", "bill", "unexpected"] as const) {
      const m = unlockMirror({ ...base, reason, amount: 200 });
      expect(m.route).toBe("emergency");
      expect(m.released).toBe(200);
    }
    const m = unlockMirror({ ...base, reason: "health", amount: 200 });
    expect(m.goalBefore).toBe(0.5);
    expect(m.goalAfter).toBe(0.3);
    expect(m.unlockNumber).toBe(1);
  });

  it("something I want always waits 24 h, for the whole Lock (never blocked)", () => {
    const m = unlockMirror({ ...base, reason: "want", amount: 200 });
    expect(m.route).toBe("wait");
    expect(m.released).toBe(500);
    expect(m.goalAfter).toBe(0);
  });

  it("over 300 lei, or the emergency already used: waits 24 h, and counts as the 2nd unlock", () => {
    expect(unlockMirror({ ...base, reason: "bill", amount: 400 }).route).toBe(
      "wait",
    );
    const used = unlockMirror({
      ...base,
      lock: { ...lock, amount: 300, emergencyUsed: true },
      reason: "health",
      amount: 100,
    });
    expect(used.route).toBe("wait");
    expect(used.unlockNumber).toBe(2);
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

describe("planEdit", () => {
  const old = { ...DEFAULT_RITM_SETTINGS, enabled: true };

  it("a bigger Lock or a new goal applies now", () => {
    const next = { ...old, lock: { amount: 800, unlockDay: 20 }, goals: [{ name: "Laptop", amount: 6000, months: 12 }] };
    expect(planEdit(old, next, 5)).toEqual({ kind: "applied", settings: next });
  });

  it("a smaller Lock keeps the old Lock and asks for the reason screen", () => {
    const next = { ...old, lock: { amount: 300, unlockDay: 20 }, goals: [{ name: "Laptop", amount: 6000, months: 12 }] };
    const r = planEdit(old, next, 5);
    expect(r.kind).toBe("needsUnlock");
    if (r.kind === "needsUnlock") {
      expect(r.lockDecrease).toBe(200);
      expect(r.settings.lock).toEqual({ amount: 500, unlockDay: 20 });
      expect(r.settings.goals[0].name).toBe("Laptop"); // the safe part applies anyway
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
