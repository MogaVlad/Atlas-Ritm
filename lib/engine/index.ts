// Import everything from "@/lib/engine". Function names are final (C2 contract).
export * from "./types";
export { RULES } from "./config";
export { computePace, isCounted, usualDailySpend } from "./pace";
export { detectHabits, habitNote, isHabit, lockSuggestion, type Habit, type HabitNote } from "./habits";
export { shouldNotify, alertActions, moveToLockAmount, INITIAL_ALERT_MEMORY } from "./alerts";
export { shouldShowSpeedBump } from "./speedbump";
export { createLock, requestUnlock, requestUnlockWithReason, resolveLock, emergencyRelease, interestEstimate } from "./lock";
export { monthSummary, raiseSavingPlan } from "./summary";
export { lockPreview, unlockMirror, UNLOCK_REASONS, goalPlan, goalProgress, planEdit, type LockPreview, type UnlockMirror } from "./plan";
export { pensionDeductibleLimit, pensionTaxBenefit, checkPensionContribution, pensionSummary } from "./pension";
export { ritmOffDay, isRitmOffDue, essentialsTotal } from "./settings";
export { goalMonthly, goalsPlan, isValidGoal, type GoalsPlan } from "./goals";
