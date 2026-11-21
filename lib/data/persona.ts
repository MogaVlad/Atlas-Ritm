import { RULES } from "@/lib/engine/config";
import type { Category, RitmSettings } from "@/lib/engine/types";

/**
 * Luca, the demo persona. Every amount is in lei.
 * illustrative, replace with sourced figure — the Pitcher swaps these for sourced numbers.
 */

export const NET_SALARY = 4800; // illustrative, replace with sourced figure

export const RENT = 1800; // illustrative, replace with sourced figure (shared flat, Cluj)
export const UTILITIES = 250; // illustrative, replace with sourced figure
export const PHONE = 50; // illustrative, replace with sourced figure
export const TRANSPORT_PASS = 80; // illustrative, replace with sourced figure

export const ESSENTIALS_TOTAL = RENT + UTILITIES + PHONE + TRANSPORT_PASS; // 2180
export const LOCK_AMOUNT = RULES.lock.defaultAmount; // 500
export const LOCK_UNLOCK_DAY = RULES.lock.defaultUnlockDay; // 20

/** Money Luca can spend this month: salary − essentials − Lock = 2120 lei. */
export const SPENDING_POOL = NET_SALARY - ESSENTIALS_TOTAL - LOCK_AMOUNT;

export const GOAL = { name: "Islanda 2027", amount: 9000 }; // illustrative, replace with sourced figure

export const ESSENTIAL_CATEGORIES: Category[] = ["rent", "utilities", "phone", "transport"];

/** Monthly amount of each detected essential: Settings lists them and totals the ones kept as essential. */
export const ESSENTIAL_AMOUNTS: Partial<Record<Category, number>> = {
  rent: RENT,
  utilities: UTILITIES,
  phone: PHONE,
  transport: TRANSPORT_PASS,
};

export const PERSONA = {
  name: "Luca",
  age: 23,
  job: "Junior QA tester",
  city: "Cluj-Napoca",
  employer: "Codex Labs SRL", // fictional
  netSalary: NET_SALARY,
  cardLast4: "4821",
} as const;

/** Ritm settings before onboarding: off, Heads-up preselected, Lock 500 lei until day 20. */
export const DEFAULT_RITM_SETTINGS: RitmSettings = {
  enabled: false,
  level: "headsup",
  essentialCategories: ESSENTIAL_CATEGORIES,
  essentialsTotal: ESSENTIALS_TOTAL,
  goal: GOAL,
  speedBumpThreshold: RULES.speedBump.thresholdLei,
  lock: { amount: LOCK_AMOUNT, unlockDay: LOCK_UNLOCK_DAY },
};
