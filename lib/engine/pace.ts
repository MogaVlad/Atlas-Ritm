import { RULES } from "./config";
import type { Day, PaceState, RitmSettings, Transaction } from "./types";

/**
 * The pace of spending since payday, for one day of the cycle.
 * TODO(C4): implement the "Ritm rules" from CLAUDE.md. Placeholder: a calm day-6 state.
 */
export function computePace(transactions: Transaction[], settings: RitmSettings, day: Day): PaceState {
  void transactions;
  void settings;
  const pool = 2120;
  const spent = 500;
  return {
    dayOfCycle: day,
    cycleLength: RULES.cycleLength,
    pool,
    spent,
    remaining: pool - spent,
    pctSpent: spent / pool,
    pctMonthPassed: day / RULES.cycleLength,
    paceRatio: 1,
    last48hSpent: 0,
    projectedRunOutDay: null,
    safeToSpendToday: 70,
    severity: "ok",
    reasons: [],
  };
}
