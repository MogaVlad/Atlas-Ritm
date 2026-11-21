import type { Day, EmergencyResult, LockState } from "./types";

/**
 * Early unlock: the money is released 24h (one demo day) after the request.
 * TODO(C4): implement the release on the next day. Placeholder: marks the request.
 */
export function requestUnlock(lock: LockState, day: Day): LockState {
  return { ...lock, status: "unlockRequested", requestedAtDay: day };
}

/**
 * Emergency release: up to 300 lei instantly, once per cycle.
 * TODO(C4): enforce the limits. Placeholder: always succeeds.
 */
export function emergencyRelease(lock: LockState, amount: number): EmergencyResult {
  return { ok: true, lock: { ...lock, amount: lock.amount - amount, emergencyUsed: true }, released: amount };
}

/**
 * Estimated interest on savings: amount × rate × days ÷ 365, minus 10% tax.
 * TODO(C4): implement. Placeholder: 0.
 */
export function interestEstimate(amount: number, days: number, annualRate: number): number {
  void amount;
  void days;
  void annualRate;
  return 0;
}
