/**
 * The rules engine. Pure functions only: no React, no store, no Date.now().
 * Thresholds come from ./config.
 */
import { RULES } from "./config";
import { addDays } from "./dates";
import type { Category, ISODate, Lock, Transaction } from "./types";

// ─── Pace ────────────────────────────────────────────────────────────────────

export type PaceLevel = "ok" | "watch" | "high";

export interface Pace {
  spent: number;
  budget: number;
  /** What an even pace would have spent by today. */
  expected: number;
  /** spent / expected; 0 when nothing is expected yet. */
  ratio: number;
  /** Spending at today's rate until payday. */
  projected: number;
  level: PaceLevel;
}

export function computePace(p: { spent: number; budget: number; dayOfCycle: number; cycleLength: number }): Pace {
  const expected = p.budget > 0 ? (p.budget * p.dayOfCycle) / p.cycleLength : 0;
  const ratio = expected > 0 ? p.spent / expected : 0;
  const projected = p.dayOfCycle > 0 ? (p.spent / p.dayOfCycle) * p.cycleLength : 0;

  let level: PaceLevel = "ok";
  if (p.spent > p.budget) level = "high";
  else if (p.dayOfCycle >= RULES.pace.fromDay) {
    if (ratio >= RULES.pace.highRatio) level = "high";
    else if (ratio >= RULES.pace.watchRatio) level = "watch";
  }
  return { spent: p.spent, budget: p.budget, expected, ratio, projected, level };
}

// ─── Safe to spend ───────────────────────────────────────────────────────────

export interface SafeToSpend {
  /** balance − locked */
  available: number;
  reservedForBills: number;
  reservedForSavings: number;
  /** Spendable until payday without missing a bill or the savings goal. Never negative. */
  total: number;
  /** total / daysLeft, rounded down to whole RON. */
  perDay: number;
  /** Missing amount when bills + savings exceed what's available; 0 otherwise. */
  shortfall: number;
}

export function computeSafeToSpend(p: {
  balance: number;
  locked: number;
  upcomingBills: number;
  savingsReserve: number;
  daysLeft: number;
}): SafeToSpend {
  const available = p.balance - p.locked;
  const raw = available - p.upcomingBills - p.savingsReserve;
  const total = Math.max(0, raw);
  return {
    available,
    reservedForBills: p.upcomingBills,
    reservedForSavings: p.savingsReserve,
    total,
    perDay: Math.floor(total / Math.max(1, p.daysLeft)),
    shortfall: raw < 0 ? -raw : 0,
  };
}

// ─── Payday spike ────────────────────────────────────────────────────────────

export interface Spike {
  /** Last day of the payday window (inclusive). */
  windowEnd: ISODate;
  inWindow: boolean;
  spentInWindow: number;
  /** spentInWindow / budget */
  share: number;
  isSpike: boolean;
}

export function detectSpike(p: {
  transactions: Transaction[];
  cycleStart: ISODate;
  today: ISODate;
  budget: number;
}): Spike {
  const windowEnd = addDays(p.cycleStart, RULES.spike.windowDays - 1);
  const spentInWindow = p.transactions
    .filter(
      (t) =>
        t.kind === "discretionary" &&
        t.direction === "out" &&
        t.date >= p.cycleStart &&
        t.date <= windowEnd &&
        t.date <= p.today,
    )
    .reduce((s, t) => s + t.amount, 0);
  const share = p.budget > 0 ? spentInWindow / p.budget : 0;
  return {
    windowEnd,
    inWindow: p.today >= p.cycleStart && p.today <= windowEnd,
    spentInWindow,
    share,
    isSpike: share >= RULES.spike.shareThreshold,
  };
}

// ─── Speed bump ──────────────────────────────────────────────────────────────

export type SpeedBumpReason =
  /** More than what's safe to spend until payday. */
  | "exceeds_safe_to_spend"
  /** A big share of what's left. */
  | "large_vs_remaining"
  /** Spending pace is already high. */
  | "pace_high"
  /** Big spending in the days right after payday. */
  | "payday_spike";

export interface SpeedBump {
  trigger: boolean;
  reasons: SpeedBumpReason[];
  /** Safe-to-spend if the payment goes through. */
  after: { total: number; perDay: number };
}

export function evaluatePayment(p: {
  amount: number;
  category: Category;
  pace: Pace;
  safeToSpend: SafeToSpend;
  spike: Spike;
  daysLeft: number;
}): SpeedBump {
  const cfg = RULES.speedBump;
  const reasons: SpeedBumpReason[] = [];
  const exceeds = p.amount > p.safeToSpend.total;
  if (exceeds) reasons.push("exceeds_safe_to_spend");

  const isWant = !cfg.essentialCategories.includes(p.category);
  if (isWant && p.amount >= cfg.minAmount) {
    if (!exceeds && p.amount > p.safeToSpend.total * cfg.largeShareOfRemaining) reasons.push("large_vs_remaining");
    if (p.pace.level === "high") reasons.push("pace_high");
    if (p.spike.isSpike && p.spike.inWindow) reasons.push("payday_spike");
  }

  const afterTotal = Math.max(0, p.safeToSpend.total - p.amount);
  return {
    trigger: reasons.length > 0,
    reasons,
    after: { total: afterTotal, perDay: Math.floor(afterTotal / Math.max(1, p.daysLeft)) },
  };
}

// ─── Lock ────────────────────────────────────────────────────────────────────

export type LockError = "amount_too_small" | "amount_exceeds_available" | "until_not_in_future";
export type LockResult = { ok: true; lock: Lock } | { ok: false; error: LockError };

export function createLock(p: { id: string; amount: number; today: ISODate; until: ISODate; available: number }): LockResult {
  if (p.amount < RULES.lock.minAmount) return { ok: false, error: "amount_too_small" };
  if (p.amount > p.available) return { ok: false, error: "amount_exceeds_available" };
  if (p.until <= p.today) return { ok: false, error: "until_not_in_future" };
  return { ok: true, lock: { id: p.id, amount: p.amount, createdOn: p.today, until: p.until, status: "active" } };
}

/** Starts the cool-off. A second request keeps the first date. */
export function requestEarlyUnlock(lock: Lock, today: ISODate): Lock {
  if (lock.status !== "active" || lock.earlyUnlockOn) return lock;
  return { ...lock, earlyUnlockOn: addDays(today, RULES.lock.coolOffDays) };
}

export function canRelease(lock: Lock, today: ISODate): boolean {
  if (lock.status !== "active") return false;
  return today >= lock.until || (lock.earlyUnlockOn !== undefined && today >= lock.earlyUnlockOn);
}

/** Releases every lock whose date has come. Run whenever the demo clock moves. */
export const settleLocks = (locks: Lock[], today: ISODate): Lock[] =>
  locks.map((l) => (canRelease(l, today) ? { ...l, status: "released" as const } : l));

export const totalLocked = (locks: Lock[]): number =>
  locks.filter((l) => l.status === "active").reduce((s, l) => s + l.amount, 0);

// ─── Pillar III example ──────────────────────────────────────────────────────

export interface PensionProjection {
  years: number;
  annualReturn: number;
  /** Nominal value at retirement. Illustrative, never shown as a promise. */
  futureValue: number;
}

export function projectPension(p: { amount: number; age: number; annualReturn?: number; retirementAge?: number }): PensionProjection {
  const annualReturn = p.annualReturn ?? RULES.pension.illustrativeAnnualReturn;
  const years = Math.max(0, (p.retirementAge ?? RULES.pension.retirementAge) - p.age);
  return { years, annualReturn, futureValue: Math.round(p.amount * Math.pow(1 + annualReturn, years)) };
}
