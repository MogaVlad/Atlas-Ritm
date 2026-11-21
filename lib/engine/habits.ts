import { RULES } from "./config";
import { isCounted, usualDailySpend } from "./pace";
import type { Category, Day, PaceState, RitmSettings, Transaction } from "./types";

/** Section 11 F. No AI decides anything: pure functions, same history → same answer, every rule tested. */

export interface Habit {
  merchant: string;
  category: Category;
  /** The usual amount (median of the matching purchases), lei. */
  typical: number;
  /** Matching purchases per week over the last 4 weeks. */
  perWeek: number;
}

const WEEKS = 4;
/** How far a purchase may be from the usual amount and still be the habit (±25%). */
const TOLERANCE = 0.25;
/** Weeks (of the last 4) a merchant must appear in to be a habit. */
const MIN_WEEKS = 3;

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const near = (amount: number, typical: number) => Math.abs(amount - typical) <= typical * TOLERANCE;

/**
 * Habits: a merchant that appears in at least 3 of the last 4 weeks with an amount within ±25% of
 * its usual amount (e.g. Cafeneaua Nord, ~12 lei, every other day). \`history\` is last month
 * (days 1–30), placed right before this one, so the 4 weeks can reach back across payday.
 */
export function detectHabits(
  transactions: readonly Transaction[],
  history: readonly Transaction[],
  settings: RitmSettings,
  day: Day,
): Habit[] {
  const from = day - WEEKS * 7 + 1;
  const timeline = [
    ...history.map((t) => ({ ...t, day: t.day - RULES.cycleLength })),
    ...transactions.filter((t) => t.day >= 1 && t.day <= day),
  ].filter((t) => t.day >= from && t.day <= day && isCounted(t, settings));

  const byMerchant = new Map<string, Transaction[]>();
  for (const t of timeline) byMerchant.set(t.merchant, [...(byMerchant.get(t.merchant) ?? []), t]);

  const habits: Habit[] = [];
  for (const [merchant, list] of byMerchant) {
    const typical = median(list.map((t) => t.amount));
    const matching = list.filter((t) => near(t.amount, typical));
    const weeks = new Set(matching.map((t) => Math.floor((day - t.day) / 7)));
    if (weeks.size >= MIN_WEEKS) {
      habits.push({ merchant, category: list[0].category, typical, perWeek: matching.length / WEEKS });
    }
  }
  return habits.sort((a, b) => b.typical * b.perWeek - a.typical * a.perWeek);
}

/** Is this purchase one of the user's habits? */
export function isHabit(t: Transaction, habits: readonly Habit[]): boolean {
  return habits.some((h) => h.merchant === t.merchant && near(t.amount, h.typical));
}

export interface HabitNote {
  /** Show the soft "your usual rhythm" note instead of the Heads-up. */
  soft: boolean;
  /** The habits behind it, biggest first (for the text). */
  merchants: string[];
}

/**
 * Tone, not math (section 11 F). Habit spending still counts toward the spending money. When the
 * pace is above usual but the extra comes mostly from habits AND the money lasts until payday at the
 * usual day, the user gets the soft note. If the money would run out early, the normal Heads-up.
 */
export function habitNote(
  pace: PaceState,
  transactions: readonly Transaction[],
  history: readonly Transaction[],
  settings: RitmSettings,
  day: Day,
): HabitNote {
  const none: HabitNote = { soft: false, merchants: [] };
  if (history.length === 0 || pace.severity === "ok" || pace.projectedRunOutDay !== null) return none;

  const habits = detectHabits(transactions, history, settings, day);
  const counted = transactions.filter((t) => t.day >= 1 && t.day <= day && isCounted(t, settings));
  const habitSpent = counted.filter((t) => isHabit(t, habits)).reduce((s, t) => s + t.amount, 0);
  const expectedHabit = habits.reduce((s, h) => s + (h.typical * h.perWeek * day) / 7, 0);
  const expected = usualDailySpend(history, settings) * Math.max(day, RULES.pace.floorDay);
  const extra = pace.spent - expected;
  const extraFromHabits = habitSpent - expectedHabit;
  if (extra <= 0 || extraFromHabits < extra / 2) return none;

  const spentBy = (merchant: string) => counted.filter((t) => t.merchant === merchant).reduce((s, t) => s + t.amount, 0);
  const merchants = habits
    .filter((h) => spentBy(h.merchant) > 0)
    .sort((a, b) => spentBy(b.merchant) - spentBy(a.merchant))
    .slice(0, 2)
    .map((h) => h.merchant);
  return { soft: true, merchants };
}

/**
 * A Lock that fits real spending (section 11 F, the plan suggestion): salary − essentials − what
 * last month's spending came to, rounded down to 50 lei. 0 when nothing would be left.
 */
export function lockSuggestion(history: readonly Transaction[], settings: RitmSettings, netSalary: number): number {
  const usualMonth = usualDailySpend(history, settings) * RULES.cycleLength;
  return Math.max(0, Math.floor((netSalary - settings.essentialsTotal - usualMonth) / 50) * 50);
}
