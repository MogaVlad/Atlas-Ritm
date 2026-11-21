// Import everything from "@/lib/engine". Function names are final (C2 contract).
export * from "./types";
export { RULES } from "./config";
export { computePace, isCounted } from "./pace";
export { shouldNotify, alertActions, INITIAL_ALERT_MEMORY } from "./alerts";
export { shouldShowSpeedBump } from "./speedbump";
export { createLock, requestUnlock, resolveLock, emergencyRelease, interestEstimate } from "./lock";
export { monthSummary, raiseSavingPlan } from "./summary";
export { lockPreview, unlockMirror, UNLOCK_REASONS, type LockPreview, type UnlockMirror, type UnlockReason } from "./plan";
export { pensionDeductibleLimit, pensionTaxBenefit, checkPensionContribution, pensionSummary } from "./pension";
export { ritmOffDay, isRitmOffDue, essentialsTotal } from "./settings";
