import { describe, expect, it } from "vitest";
import { createLock, lockPreview, unlockMirror } from "@/lib/engine";

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
