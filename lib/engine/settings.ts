import { RULES } from "./config";
import type { Category, Day } from "./types";

/** Turning Ritm off takes effect RULES.turnOffDelayDays later (24 h = 1 demo day). Returns the day it turns off. */
export function ritmOffDay(requestDay: Day): Day {
  return requestDay + RULES.turnOffDelayDays;
}

/** Has a requested turn-off come into effect? Ritm stays on until that day. */
export function isRitmOffDue(offDay: Day | null, today: Day): boolean {
  return offDay !== null && today >= offDay;
}

/** Lei per month kept out of the spending money for the chosen essential categories. */
export function essentialsTotal(categories: Category[], monthly: Partial<Record<Category, number>>): number {
  return categories.reduce((sum, c) => sum + (monthly[c] ?? 0), 0);
}
