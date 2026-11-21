import { RULES } from "./config";
import type { Goal } from "./types";

/** Lei a month to reach a goal in the time chosen for it, rounded up to whole lei. */
export function goalMonthly(goal: Goal): number {
  return Math.ceil(goal.amount / Math.max(1, goal.months));
}

export interface GoalsPlan {
  /** Lei a month for each goal, in the same order. */
  monthly: number[];
  totalMonthly: number;
  /** totalMonthly ÷ net salary. */
  shareOfSalary: number;
  /** Lei a month at the savings guideline (20% of the net salary). */
  guidelineMonthly: number;
  /** More than the guideline: the UI explains, it never blocks. */
  overGuideline: boolean;
}

/** What all the goals together ask for each month, compared with the savings guideline. */
export function goalsPlan(goals: readonly Goal[], netSalary: number): GoalsPlan {
  const monthly = goals.map(goalMonthly);
  const totalMonthly = monthly.reduce((sum, m) => sum + m, 0);
  const guidelineMonthly = Math.floor(netSalary * RULES.goals.savingsGuideline);
  return {
    monthly,
    totalMonthly,
    shareOfSalary: netSalary > 0 ? totalMonthly / netSalary : 0,
    guidelineMonthly,
    overGuideline: totalMonthly > guidelineMonthly,
  };
}

/** A goal the user can save: a name, an amount above zero and a whole number of months in range. */
export function isValidGoal(goal: Goal): boolean {
  return (
    goal.name.trim().length > 0 &&
    Number.isFinite(goal.amount) &&
    goal.amount > 0 &&
    Number.isInteger(goal.months) &&
    goal.months >= 1 &&
    goal.months <= RULES.goals.maxMonths
  );
}
