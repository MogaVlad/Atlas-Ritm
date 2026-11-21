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

/** Lei to suggest moving to the Lock: 200, but never more than what's left. */
const MOVE_TO_LOCK_LEI = 200;

/**
 * The one-tap actions offered in the Heads-up sheet.
 * After 2 ignored alerts, the Speed bump is suggested first.
 */
export function alertActions(state: PaceState, memory: AlertMemory): AlertAction[] {
  if (state.severity === "ok") return [];

  const moveAmount = Math.max(0, Math.min(MOVE_TO_LOCK_LEI, Math.floor(state.remaining)));
  const moveToLock: AlertAction = { kind: "moveToLock", labelKey: "ritm.headsUp.actions.moveToLock", amount: moveAmount };
  const speedBump: AlertAction = { kind: "enableSpeedBump", labelKey: "ritm.headsUp.actions.enableSpeedBump" };
  const planned: AlertAction = { kind: "markPlanned", labelKey: "ritm.headsUp.actions.markPlanned" };

  const actions =
    memory.ignoredCount >= RULES.alerts.ignoredBeforeSuggest ? [speedBump, moveToLock, planned] : [moveToLock, speedBump, planned];
  return actions.filter((a) => a.kind !== "moveToLock" || (a.amount ?? 0) > 0);
}
