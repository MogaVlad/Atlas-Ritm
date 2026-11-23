import { RULES } from "./config";
import { interestEstimate } from "./lock";
import type { Day, GoalPlan, GoalPlanInput, LockState, PlanEditResult, RitmSettings, UnlockReason } from "./types";

/** Section 11 B: what a Lock amount means for the month, shown live while the user picks it. */
export interface LockPreview {
  /** Spending money per day left in the cycle (today included). */
  perDay: number;
  /** Lock amount plus the interest estimate, back on the unlock day. */
  backOnUnlock: number;
  /** Share of the goal this Lock covers (0–1, can exceed 1). */
  goalPct: number;
  /** Under RULES.lock.tightPerDayLei a day: show the gentle warning. */
  tight: boolean;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const clampDay = (day: Day) => Math.min(RULES.cycleLength, Math.max(1, Math.round(day)));

/** `spendingMoney` already has the Lock taken out (computePace(...).pool with this Lock). */
export function lockPreview(input: {
  spendingMoney: number;
  lockAmount: number;
  unlockDay: Day;
  goalAmount: number;
  day?: Day;
}): LockPreview {
  const day = input.day ?? 1;
  const daysLeft = Math.max(1, RULES.cycleLength - day + 1);
  const perDay = round2(Math.max(0, input.spendingMoney) / daysLeft);
  const lockAmount = Math.max(0, input.lockAmount);
  return {
    perDay,
    backOnUnlock: round2(
      lockAmount +
        interestEstimate(
          lockAmount,
          input.unlockDay - day,
          RULES.savings.annualRate,
        ),
    ),
    goalPct: input.goalAmount > 0 ? lockAmount / input.goalAmount : 0,
    tight: perDay < RULES.lock.tightPerDayLei,
  };
}

/** Section 11 C: the reasons a user can give for taking money out of the Lock. */
export const UNLOCK_REASONS: readonly UnlockReason[] = [
  "health",
  "bill",
  "unexpected",
  "want",
];

export interface UnlockMirror {
  /** "emergency" = up to 300 lei now; "wait" = the whole Lock, 24 h later. Never blocked. */
  route: "emergency" | "wait";
  /** Lei that would leave the Lock. */
  released: number;
  /** Goal progress (saved ÷ goal) before and after, 0–1. */
  goalBefore: number;
  goalAfter: number;
  /** 1 = first unlock this cycle. */
  unlockNumber: number;
}

/**
 * The mirror: the facts of an unlock, before it happens. Health, bill and unexpected use the
 * emergency release (≤ 300 lei, once per cycle); "want", a bigger amount or a second time wait 24 h.
 */
export function unlockMirror(input: {
  lock: LockState;
  reason: UnlockReason;
  amount: number;
  saved: number;
  goalAmount: number;
}): UnlockMirror {
  const { lock, reason, saved, goalAmount } = input;
  const max = Math.min(RULES.lock.emergencyMaxLei, lock.amount);
  const emergency =
    reason !== "want" &&
    !lock.emergencyUsed &&
    input.amount > 0 &&
    input.amount <= max;
  const released = emergency ? input.amount : lock.amount;
  const pct = (lei: number) =>
    goalAmount > 0 ? Math.max(0, lei) / goalAmount : 0;
  return {
    route: emergency ? "emergency" : "wait",
    released,
    goalBefore: pct(saved),
    goalAfter: pct(saved - released),
    unlockNumber:
      (lock.emergencyUsed ? 1 : 0) +
      (lock.status === "unlockRequested" ? 1 : 0) +
      1,
  };
}

/** 0–1 share of the goal reached with `saved` lei. */
export function goalProgress(saved: number, goalAmount: number): number {
  if (goalAmount <= 0) return 0;
  return Math.min(1, Math.max(0, saved / goalAmount));
}

/**
 * Goal with an amount and a date: lei a month needed by the date, whether the
 * chosen monthly Lock covers it, and how many months the chosen Lock takes instead.
 */
export function goalPlan(goal: GoalPlanInput, monthlyLock: number): GoalPlan {
  const left = Math.max(0, goal.amount - goal.saved);
  const months = Math.max(1, Math.ceil(goal.monthsLeft));
  const neededPerMonth = Math.ceil(left / months);
  return {
    neededPerMonth,
    fitsLock: monthlyLock >= neededPerMonth,
    monthsWithLock: left === 0 ? 0 : monthlyLock > 0 ? Math.ceil(left / monthlyLock) : null,
  };
}

/**
 * Editing the plan (edit rule). Anything safer (a bigger Lock, a later unlock day,
 * a new goal, other settings) applies now. A smaller Lock or an earlier unlock day goes through
 * the reason screen + 24h (requestUnlockWithReason): there is no back door around the Lock.
 */
export function planEdit(old: RitmSettings, next: RitmSettings, day: Day): PlanEditResult {
  const lockDecrease = round2(Math.max(0, old.lock.amount - next.lock.amount));
  const earlierDay = next.lock.unlockDay < old.lock.unlockDay;
  if (lockDecrease === 0 && !earlierDay) return { kind: "applied", settings: next };

  return {
    kind: "needsUnlock",
    // Keep the old Lock (amount and day) until the unlock goes through; everything else applies.
    settings: { ...next, lock: { amount: Math.max(old.lock.amount, next.lock.amount), unlockDay: Math.max(old.lock.unlockDay, next.lock.unlockDay) } },
    lockDecrease,
    requestedUnlockDay: earlierDay ? Math.max(clampDay(day), next.lock.unlockDay) : old.lock.unlockDay,
  };
}
