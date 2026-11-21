import { RULES } from "./config";
import type { Day, EmergencyResult, LockState, UnlockDecision, UnlockReason, UnlockRequest } from "./types";

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
  if (day >= lock.unlockDay) return { ...lock, status: "unlocked" };
  if (earlyDue) {
    const asked = lock.requestedAmount ?? lock.amount;
    if (asked < lock.amount) {
      // Partial early unlock: the asked part is released, the rest stays locked until its day.
      return { status: "locked", amount: lock.amount - asked, unlockDay: lock.unlockDay, emergencyUsed: lock.emergencyUsed };
    }
    return { ...lock, status: "unlocked" };
  }
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

/** Reasons that may use the emergency release. "want" always waits 24h (never blocked). */
const EMERGENCY_REASONS: readonly UnlockReason[] = ["health", "bill", "unexpected"];

/** The four reason buttons on the mirror screen, in order, as i18n keys. */
export const UNLOCK_REASONS: readonly { id: UnlockReason; key: string }[] = [
  { id: "health", key: "ritm.mirror.reason.health" },
  { id: "bill", key: "ritm.mirror.reason.bill" },
  { id: "unexpected", key: "ritm.mirror.reason.unexpected" },
  { id: "want", key: "ritm.mirror.reason.want" },
];

/**
 * Unlocking with a reason (section 11 C, "the mirror").
 * - health / bill / unexpected, up to 300 lei, first time this cycle: released now (emergency release).
 * - Anything else (more than 300 lei, the second time, or "want"): released 24h later.
 * The money is never refused; only the path changes.
 */
export function requestUnlockWithReason(lock: LockState, day: Day, request: UnlockRequest): UnlockDecision {
  if (lock.status === "unlocked" || lock.amount <= 0) return { ok: false, reason: "notLocked" };
  const amount = Math.round(request.amount * 100) / 100;
  if (!(amount > 0) || amount > lock.amount) return { ok: false, reason: "invalidAmount" };

  const note = request.note?.trim().slice(0, 140) || undefined;
  const record = { day, amount, reason: request.reason, ...(note ? { note } : {}) };

  if (EMERGENCY_REASONS.includes(request.reason)) {
    const emergency = emergencyRelease(lock, amount);
    if (emergency.ok) {
      return { ok: true, path: "emergency", lock: emergency.lock, released: amount, record: { ...record, path: "emergency" } };
    }
  }

  const waiting: LockState = { ...lock, status: "unlockRequested", requestedAtDay: day, requestedAmount: amount };
  return {
    ok: true,
    path: "wait",
    lock: waiting,
    releaseDay: Math.min(day + RULES.lock.earlyUnlockDelayDays, lock.unlockDay),
    record: { ...record, path: "wait" },
  };
}
