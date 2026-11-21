import { RULES } from "./config";
import type { AlertAction, AlertMemory, Day, PaceState, Severity } from "./types";

const RANK: Record<Severity, number> = { ok: 0, watch: 1, spike: 2 };

/** Starting memory for a new cycle. */
export const INITIAL_ALERT_MEMORY: AlertMemory = { lastNotifiedDay: null, lastSeverity: "ok", ignoredCount: 0, lastPctSpent: 0 };

/**
 * Should a Heads-up be shown today?
 * Never when the level is "ok"; yes when the level rises, or when spending jumped a lot since
 * the last Heads-up (a big Saturday right after a warning still gets one); otherwise at most every 48h.
 */
export function shouldNotify(state: PaceState, memory: AlertMemory, day: Day): boolean {
  if (state.severity === "ok") return false;
  if (RANK[state.severity] > RANK[memory.lastSeverity]) return true;
  if (memory.lastNotifiedDay === null) return true;
  if (state.pctSpent - (memory.lastPctSpent ?? 0) >= RULES.alerts.renotifyJumpPct) return true;
  return day - memory.lastNotifiedDay >= RULES.alerts.minDaysBetween;
}

/**
 * Lei to suggest moving to the Lock: what the days after it opens need at a pace that lasts.
 * Money left ÷ days left (today included) = the lasting pace a day; times the days from the
 * unlock day to payday. Rounded down to 10 lei, never more than what's left; 0 (no suggestion)
 * once the Lock's day has come. Day 6, 954 lei left, Lock until 20: 38,16 × 11 days → 410 lei.
 */
export function moveToLockAmount(state: PaceState, unlockDay: Day): number {
  if (unlockDay <= state.dayOfCycle || state.remaining <= 0) return 0;
  const perDay = state.remaining / (state.cycleLength - state.dayOfCycle + 1);
  const daysAfterUnlock = state.cycleLength - unlockDay + 1;
  return Math.min(Math.floor((perDay * daysAfterUnlock) / 10) * 10, Math.floor(state.remaining));
}

/**
 * The one-tap actions offered in the Heads-up sheet.
 * After 2 ignored alerts, the Speed bump is suggested first.
 */
export function alertActions(
  state: PaceState,
  memory: AlertMemory,
  unlockDay: Day = RULES.lock.defaultUnlockDay,
): AlertAction[] {
  if (state.severity === "ok") return [];

  const moveAmount = moveToLockAmount(state, unlockDay);
  const moveToLock: AlertAction = { kind: "moveToLock", labelKey: "ritm.headsUp.actions.moveToLock", amount: moveAmount };
  const speedBump: AlertAction = { kind: "enableSpeedBump", labelKey: "ritm.headsUp.actions.enableSpeedBump" };
  const planned: AlertAction = { kind: "markPlanned", labelKey: "ritm.headsUp.actions.markPlanned" };

  const actions =
    memory.ignoredCount >= RULES.alerts.ignoredBeforeSuggest ? [speedBump, moveToLock, planned] : [moveToLock, speedBump, planned];
  return actions.filter((a) => a.kind !== "moveToLock" || (a.amount ?? 0) > 0);
}
