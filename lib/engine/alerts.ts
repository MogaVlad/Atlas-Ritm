import type { AlertAction, AlertMemory, Day, PaceState } from "./types";

/**
 * Should a Heads-up be shown today? Only when the level rises, or at most every 48h;
 * never when severity is "ok".
 * TODO(C4): implement. Placeholder: never notifies.
 */
export function shouldNotify(state: PaceState, memory: AlertMemory, day: Day): boolean {
  void state;
  void memory;
  void day;
  return false;
}

/**
 * The one-tap actions offered in the Heads-up sheet.
 * TODO(C4): pick actions from the state (e.g. suggest Speed bump after 2 ignored alerts).
 * Placeholder: all three actions.
 */
export function alertActions(state: PaceState, memory: AlertMemory): AlertAction[] {
  void state;
  void memory;
  return [
    { kind: "moveToLock", labelKey: "ritm.headsUp.actions.moveToLock", amount: 200 },
    { kind: "enableSpeedBump", labelKey: "ritm.headsUp.actions.enableSpeedBump" },
    { kind: "markPlanned", labelKey: "ritm.headsUp.actions.markPlanned" },
  ];
}
