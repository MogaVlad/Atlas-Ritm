import { RULES } from "./config";
import { interestEstimate } from "./lock";
import type { Day, LockState } from "./types";

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
export type UnlockReason = "health" | "bill" | "unexpected" | "want";
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
