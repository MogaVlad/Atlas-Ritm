// Import everything from "@/lib/engine". Function names are final (C2 contract).
export * from "./types";
export { RULES } from "./config";
export { computePace, isCounted } from "./pace";
export { shouldNotify, alertActions, INITIAL_ALERT_MEMORY } from "./alerts";
export { shouldShowSpeedBump } from "./speedbump";
export { createLock, requestUnlock, resolveLock, emergencyRelease, interestEstimate } from "./lock";
export { monthSummary, raiseSavingPlan } from "./summary";
export { pensionDeductibleLimit, pensionTaxBenefit, checkPensionContribution, pensionSummary } from "./pension";
