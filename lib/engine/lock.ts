import { RULES } from "./config";
import type { Day, EmergencyResult, LockState } from "./types";

/** A new Lock for this cycle. */
export function createLock(amount: number, unlockDay: Day): LockState {
  return { status: "locked", amount, unlockDay, emergencyUsed: false };
}

/**
 * Early unlock: the request is recorded now; the money is released 24h later
 * (the next day in the demo, see resolveLock).
 */
export function requestUnlock(lock: LockState, day: Day): LockState {
  if (lock.status !== "locked") return lock;
  return { ...lock, status: "unlockRequested", requestedAtDay: day };
}

/** The Lock as it is on `day`: unlocks on its unlock day, or 24h after an early-unlock request. */
export function resolveLock(lock: LockState, day: Day): LockState {
  if (lock.status === "unlocked") return lock;
  const earlyDue =
    lock.status === "unlockRequested" &&
    lock.requestedAtDay !== undefined &&
    day >= lock.requestedAtDay + RULES.lock.earlyUnlockDelayDays;
  if (day >= lock.unlockDay || earlyDue) return { ...lock, status: "unlocked" };
  return lock;
}

/** Emergency release: up to 300 lei instantly, once per cycle. */
export function emergencyRelease(lock: LockState, amount: number): EmergencyResult {
  if (lock.status === "unlocked" || lock.amount <= 0) return { ok: false, reason: "notLocked" };
  if (lock.emergencyUsed) return { ok: false, reason: "alreadyUsed" };
  if (amount <= 0 || amount > RULES.lock.emergencyMaxLei || amount > lock.amount) return { ok: false, reason: "overLimit" };

  const left = lock.amount - amount;
  return {
    ok: true,
    released: amount,
    lock: { ...lock, amount: left, emergencyUsed: true, status: left > 0 ? lock.status : "unlocked" },
  };
}

/** Estimated interest on savings: amount × annual rate × days ÷ 365, minus 10% tax. Rounded to bani. */
export function interestEstimate(amount: number, days: number, annualRate: number): number {
  if (amount <= 0 || days <= 0 || annualRate <= 0) return 0;
  const gross = (amount * annualRate * days) / 365;
  return Math.round(gross * (1 - RULES.interestTax) * 100) / 100;
}
