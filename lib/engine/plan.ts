import { RULES } from "./config";
import { interestEstimate } from "./lock";
import type { Day, GoalPlan, GoalPlanInput, LockPreview, MonthPlan, PlanEditResult, RitmSettings, UnlockFacts } from "./types";

const round2 = (n: number) => Math.round(n * 100) / 100;
const clampDay = (day: Day) => Math.min(RULES.cycleLength, Math.max(1, Math.round(day)));

/** 0–1 share of the goal reached with `saved` lei. */
export function goalProgress(saved: number, goalAmount: number): number {
  if (goalAmount <= 0) return 0;
  return Math.min(1, Math.max(0, saved / goalAmount));
}

/**
 * The live line under the Lock slider (section 11 B): spending money, lei a day, what comes
 * back on the unlock day with the interest estimate, goal progress, and the "tight" flag.
 */
export function lockPreview(plan: MonthPlan, lockAmount: number, day: Day): LockPreview {
  const today = clampDay(day);
  const lock = Math.max(0, lockAmount);
  const spendingMoney = round2(plan.netSalary - plan.essentialsTotal - lock);
  const daysLeft = RULES.cycleLength - today + 1;
  const perDay = Math.max(0, Math.floor(spendingMoney / daysLeft));
  const interest = interestEstimate(lock, Math.max(0, plan.unlockDay - today), RULES.savings.annualRate);
  return {
    lockAmount: lock,
    spendingMoney,
    perDay,
    interest,
    backOnUnlockDay: round2(lock + interest),
    goalPct: goalProgress(plan.saved + lock, plan.goal.amount),
    tight: perDay < RULES.plan.tightPerDayLei,
  };
}

/**
 * Goal with an amount and a date (section 11 A): lei a month needed by the date, whether the
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

/** The mirror's facts (section 11 C): goal progress before → after, and which unlock this is. */
export function unlockFacts(input: { amount: number; saved: number; goalAmount: number; unlocksThisCycle: number }): UnlockFacts {
  return {
    goalPctBefore: goalProgress(input.saved, input.goalAmount),
    goalPctAfter: goalProgress(input.saved - input.amount, input.goalAmount),
    unlockNumber: input.unlocksThisCycle + 1,
  };
}

/**
 * Editing the plan (section 11 A, edit rule). Anything safer (a bigger Lock, a later unlock day,
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
