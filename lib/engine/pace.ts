import { RULES } from "./config";
import type { Category, Day, PaceState, Reason, RitmSettings, Severity, Transaction } from "./types";

/** Categories that never count against the pace, whatever the user's essentials are. */
const NEVER_COUNTED: ReadonlySet<Category> = new Set(["salary", "own_transfer", "savings", "pension"]);

/**
 * Does this transaction count against the spending money?
 * Not counted: money in (salary, refunds), essentials, own transfers, savings, purchases marked planned.
 */
export function isCounted(t: Transaction, settings: RitmSettings): boolean {
  return (
    t.amount > 0 &&
    !t.planned &&
    t.channel !== "salary" &&
    !NEVER_COUNTED.has(t.category) &&
    !settings.essentialCategories.includes(t.category)
  );
}

const sum = (list: Transaction[]) => list.reduce((s, t) => s + t.amount, 0);

/** The user's usual day: what last month's counted spending comes to per day of the cycle. */
export function usualDailySpend(history: readonly Transaction[], settings: RitmSettings): number {
  return sum(history.filter((t) => isCounted(t, settings))) / RULES.cycleLength;
}

/**
 * The pace of spending since payday, for one day of the cycle (the "Ritm rules" in CLAUDE.md).
 * `history` = last month's transactions (days 1–30). With it (from the 2nd month, section 11 F) the
 * pace is personal: expected spending is the user's usual day × the days passed, and the run-out
 * forecast asks whether the money lasts at the usual day from now on. Not last month's shape:
 * copying a front-loaded month would teach Ritm that a blown first week is normal.
 */
export function computePace(
  transactions: readonly Transaction[],
  settings: RitmSettings,
  day: Day,
  history?: readonly Transaction[],
): PaceState {
  const cycleLength = RULES.cycleLength;
  const upToToday = transactions.filter((t) => t.day <= day);
  const counted = upToToday.filter((t) => isCounted(t, settings));

  // Spending money = net salary − essentials − Lock amount.
  const netSalary = -sum(upToToday.filter((t) => t.category === "salary"));
  const pool = Math.max(0, netSalary - settings.essentialsTotal - settings.lock.amount);

  const spent = sum(counted);
  const spentToday = sum(counted.filter((t) => t.day === day));
  const remaining = pool - spent;
  const pctSpent = pool > 0 ? spent / pool : 0;
  const pctMonthPassed = day / cycleLength;

  // Pace = % used ÷ % expected; expected spend never computed below day 3.
  const usualDaily = history && history.length > 0 ? usualDailySpend(history, settings) : null;
  const expectedPct =
    usualDaily !== null && pool > 0
      ? Math.min(1, (usualDaily * Math.max(day, RULES.pace.floorDay)) / pool)
      : Math.max(day, RULES.pace.floorDay) / cycleLength;
  const paceRatio = pctSpent / expectedPct;

  const last48hSpent = sum(counted.filter((t) => t.day > day - RULES.burst.windowDays));
  const burst = pool > 0 && last48hSpent / pool >= RULES.burst.pct;

  // Run-out forecast at the current average daily spend.
  // Day 0 (before payday) has no days behind it yet.
  const dailyAvg = day > 0 ? spent / day : 0;
  let projectedRunOutDay: Day | null = null;
  if (remaining <= 0) projectedRunOutDay = day;
  else if (usualDaily !== null) {
    // Personal: from tomorrow at the usual day, when would it run out?
    if (usualDaily > 0) {
      const runOut = day + Math.floor(remaining / usualDaily);
      if (runOut < cycleLength) projectedRunOutDay = runOut;
    }
  } else if (dailyAvg > 0) {
    const runOut = Math.floor(pool / dailyAvg);
    if (runOut < cycleLength) projectedRunOutDay = runOut;
  }
  const daysBeforePayday = projectedRunOutDay === null ? 0 : cycleLength - projectedRunOutDay;

  // Safe to spend today = (left + spent today) ÷ days left incl. today − spent today.
  const daysLeft = cycleLength - day + 1;
  const safeToSpendToday = Math.max(0, Math.floor((remaining + spentToday) / daysLeft - spentToday));

  let severity: Severity = "ok";
  if (pctSpent >= RULES.pace.minPctSpent) {
    if (paceRatio >= RULES.pace.spikeRatio) severity = "spike";
    else if (paceRatio >= RULES.pace.watchRatio) severity = "watch";
  }
  if (burst) severity = "spike";

  const reasons: Reason[] = [];
  if (severity !== "ok") {
    reasons.push({ key: "ritm.reason.pctSpent", values: { day, pct: Math.round(pctSpent * 100) } });
    if (projectedRunOutDay !== null && daysBeforePayday >= RULES.runOut.warnDaysBeforePayday) {
      reasons.push({ key: "ritm.reason.runOut", values: { day: projectedRunOutDay, daysBefore: daysBeforePayday } });
    }
    if (burst) {
      reasons.push({ key: "ritm.reason.burst", values: { pct: Math.round((last48hSpent / pool) * 100) } });
    }
  }

  return {
    dayOfCycle: day,
    cycleLength,
    pool,
    spent,
    remaining,
    pctSpent,
    pctMonthPassed,
    paceRatio,
    last48hSpent,
    projectedRunOutDay,
    safeToSpendToday,
    severity,
    reasons,
    personal: usualDaily !== null,
  };
}
