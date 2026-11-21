// Import everything from "@/lib/engine". Function names are final (C2 contract).
export * from "./types";
export { RULES } from "./config";
export { computePace, isCounted } from "./pace";
export { shouldNotify, alertActions, INITIAL_ALERT_MEMORY } from "./alerts";
export { shouldShowSpeedBump } from "./speedbump";
export { createLock, requestUnlock, requestUnlockWithReason, UNLOCK_REASONS, resolveLock, emergencyRelease, interestEstimate } from "./lock";
export { lockPreview, goalPlan, goalProgress, unlockFacts, planEdit } from "./plan";
export { monthSummary, raiseSavingPlan } from "./summary";
export { pensionDeductibleLimit, pensionTaxBenefit, checkPensionContribution, pensionSummary } from "./pension";
export { ritmOffDay, isRitmOffDue, essentialsTotal } from "./settings";
