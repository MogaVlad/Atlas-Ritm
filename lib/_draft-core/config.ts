import type { Category } from "./types";

/**
 * Every tunable threshold of the product. Change numbers here, never inside a rule;
 * the tests in src/core/__tests__ show what each change moves.
 */
export const RULES = {
  pace: {
    /** spent / expected-by-today at or above this → "watch" (Heads-up card). */
    watchRatio: 1.2,
    /** at or above this → "high" (speed bump armed for wants). */
    highRatio: 1.5,
    /** No pace alerts before this day of the cycle; the payday window is the spike rule's job. */
    fromDay: 3,
  },
  spike: {
    /** The first N days of the cycle, payday included. */
    windowDays: 5,
    /** Share of the cycle budget spent inside the window that counts as a spike. */
    shareThreshold: 0.3,
  },
  speedBump: {
    /** A want bigger than this share of what's left safe to spend is slowed down. */
    largeShareOfRemaining: 0.25,
    /** Wants below this (RON) pass, unless they exceed safe-to-spend. */
    minAmount: 150,
    /** Needs: only slowed down when they exceed safe-to-spend. */
    essentialCategories: ["rent", "utilities", "phone", "groceries", "health", "transport"] as Category[],
  },
  lock: {
    minAmount: 50,
    /** Early unlock frees the money this many days after the request. */
    coolOffDays: 1,
  },
  pension: {
    /** Illustrative nominal yearly return for the Pillar III example. Pitcher: source it. */
    illustrativeAnnualReturn: 0.05,
    retirementAge: 65,
  },
} as const;
