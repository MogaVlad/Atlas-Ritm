// Import everything from "@/lib/engine". Function names are final (C2 contract).
export * from "./types";
export { RULES } from "./config";
export { computePace } from "./pace";
export { shouldNotify, alertActions } from "./alerts";
export { shouldShowSpeedBump } from "./speedbump";
export { requestUnlock, emergencyRelease, interestEstimate } from "./lock";
