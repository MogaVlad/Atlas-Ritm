import { RULES } from "./config";
import { computePace } from "./pace";
import type { Day, MonthSummary, PacePoint, RitmSettings, Transaction } from "./types";

/**
 * Day-30 summary: what was left on payday and how the pace went through the month.
 * Pure: the store adds the balances (kept saved, pension) next to it.
 */
export function monthSummary(
  transactions: readonly Transaction[],
  settings: RitmSettings,
  day: Day,
  history?: readonly Transaction[],
): MonthSummary {
  const last = Math.min(RULES.cycleLength, Math.max(1, Math.round(day)));
  const points: PacePoint[] = [];
  let peak: MonthSummary["peak"] = null;

  for (let d = 1; d <= last; d++) {
    const pace = computePace(transactions, settings, d, history);
    points.push({ day: d, pctSpent: pace.pctSpent, pctMonthPassed: pace.pctMonthPassed, severity: pace.severity });
    const judged = pace.pctSpent >= RULES.pace.minPctSpent;
    if (judged && (peak === null || pace.paceRatio > peak.paceRatio)) {
      peak = { day: d, paceRatio: Math.round(pace.paceRatio * 100) / 100 };
    }
  }

  const today = computePace(transactions, settings, last, history);
  return {
    day: last,
    reachedPayday: last === RULES.cycleLength,
    pool: today.pool,
    spent: today.spent,
    leftOfSpendingMoney: Math.max(0, today.remaining),
    overspent: Math.max(0, -today.remaining),
    points,
    daysOnPace: points.filter((p) => p.severity === "ok").length,
    peak,
  };
}

/** "Next raise: save half of it automatically?": how a raise would split. */
export function raiseSavingPlan(raise: number): { saved: number; kept: number } {
  const amount = Math.max(0, raise);
  const saved = Math.round(amount * RULES.raise.saveShare);
  return { saved, kept: amount - saved };
}
