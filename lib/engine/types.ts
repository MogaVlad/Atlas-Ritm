/**
 * Domain types for Ritm. This is the CONTRACT the whole team builds against (task C2):
 * screens import these types and the functions in lib/engine; only Cosma changes them.
 * Ask in chat before renaming anything here.
 */

/** Day of the salary cycle, 1–30. Day 1 is payday. */
export type Day = number;

export type Category =
  | "salary"
  | "rent"
  | "utilities"
  | "phone"
  | "transport"
  | "groceries"
  | "food_delivery"
  | "eating_out"
  | "shopping"
  | "entertainment"
  | "electronics"
  | "health"
  | "own_transfer" // between the user's own accounts: never counted
  | "savings" // money moved to savings or the Lock: never counted
  | "pension" // Pillar III contribution: never counted
  | "other";

export type Channel = "card_in_store" | "card_online" | "transfer" | "salary";

export interface Transaction {
  id: string;
  day: Day;
  /** Lei. Positive = money out; negative = money in (salary, refunds). */
  amount: number;
  merchant: string;
  category: Category;
  channel: Channel;
  /** Marked as planned by the user: not counted against the pace. */
  planned?: boolean;
  /** Display only: a payment the account couldn't cover, so it was never charged. The engine never sees these. */
  declined?: boolean;
}

/** The Ritm features with an on/off switch. The Lock is the third one: on when lock.amount > 0. */
export type RitmFeature = "headsUp" | "speedBump";

/** Something the user saves for, and the time they give themselves to reach it. */
export interface Goal {
  name: string;
  /** Lei. */
  amount: number;
  /** Months until the user wants to have it. */
  months: number;
}

export interface RitmSettings {
  enabled: boolean;
  /** Notifications when the pace gets too fast. On by default. */
  headsUp: boolean;
  /** A short pause before big online payments. Off by default. */
  speedBump: boolean;
  /** Categories that never count (rent, utilities…). */
  essentialCategories: Category[];
  /** Lei per month, taken out of the spending money. */
  essentialsTotal: number;
  /** At least one. The first is the main goal: the Speed bump and the Lock talk about it. */
  goals: Goal[];
  /** Lei. Online payments at or above this can trigger the Speed bump. */
  speedBumpThreshold: number;
  lock: { amount: number; unlockDay: Day };
}

export type Severity = "ok" | "watch" | "spike";

/** A sentence for the UI as an i18n key + values, e.g. { key: "ritm.reason.runOut", values: { day: 10 } }. */
export interface Reason {
  key: string;
  values: Record<string, string | number>;
}

export interface PaceState {
  dayOfCycle: Day;
  cycleLength: number;
  /** Spending money: net salary − essentials − Lock amount. */
  pool: number;
  spent: number;
  remaining: number;
  /** 0–1 */
  pctSpent: number;
  /** 0–1 */
  pctMonthPassed: number;
  /** pctSpent / pctMonthPassed (expected spend floored at day 3). */
  paceRatio: number;
  last48hSpent: number;
  /** Day the money runs out at the current pace; null if it lasts until payday. */
  projectedRunOutDay: Day | null;
  safeToSpendToday: number;
  severity: Severity;
  reasons: Reason[];
}

export interface LockState {
  status: "locked" | "unlockRequested" | "unlocked";
  amount: number;
  unlockDay: Day;
  /** Set when the user asks for an early unlock; money is released 24h (1 demo day) later. */
  requestedAtDay?: Day;
  /** Lei asked for in that request; missing = the whole Lock. Less than `amount` = the rest stays locked. */
  requestedAmount?: number;
  /** Emergency release used this cycle (max once). */
  emergencyUsed: boolean;
}

/** What the alert logic remembers between days (lives in the store). */
export interface AlertMemory {
  lastNotifiedDay: Day | null;
  lastSeverity: Severity;
  /** Share of spending money used at the last Heads-up (0–1). Missing in older saved demos. */
  lastPctSpent?: number;
  /** Heads-ups shown and dismissed without an action. */
  ignoredCount: number;
}

export type AlertActionKind = "moveToLock" | "enableSpeedBump" | "markPlanned";

/** A one-tap action offered in the Heads-up sheet. */
export interface AlertAction {
  kind: AlertActionKind;
  /** i18n key for the button label. */
  labelKey: string;
  /** Lei, for moveToLock. */
  amount?: number;
}

/** One point of the month's pace line (day-30 summary). */
export interface PacePoint {
  day: Day;
  /** 0–1 */
  pctSpent: number;
  /** 0–1 */
  pctMonthPassed: number;
  severity: Severity;
}

/** The month so far, for the day-30 summary. Any day works; on day 30 it is the whole month. */
export interface MonthSummary {
  day: Day;
  reachedPayday: boolean;
  pool: number;
  spent: number;
  /** Spending money left (never below 0). */
  leftOfSpendingMoney: number;
  /** Lei spent beyond the spending money (0 if none). */
  overspent: number;
  /** Day 1 → day: share of spending money used vs share of month passed. */
  points: PacePoint[];
  /** Days the pace was fine ("ok"). */
  daysOnPace: number;
  /** The fastest day, once enough money was spent to judge; null if never. */
  peak: { day: Day; paceRatio: number } | null;
}

/** Where a Pillar III contribution comes from: the purchase not made, or money kept at unlock. */
export type PensionSource = "currentAccount" | "savings";

export interface PensionContribution {
  id: string;
  day: Day;
  amount: number;
  source: PensionSource;
}

/** Totals for the pension explainer. Facts only: no return estimates, ever. */
export interface PensionSummary {
  total: number;
  /** Lei equivalent of the yearly deduction cap. */
  deductibleLimit: number;
  deductibleUsed: number;
  deductibleLeft: number;
  /** Income tax saved so far on the deductible part ("up to", it depends on the payslip). */
  taxSavedUpTo: number;
}

export interface PensionCheckInput {
  amount: number;
  /** The user ticked "I understand this money is for retirement" AND pressed the explicit button. */
  consent: boolean;
  /** Lei the source can give right now. */
  available: number;
  /** Already contributed this year. */
  alreadyThisYear: number;
}

export type PensionCheck =
  | { ok: true; amount: number; deductible: number; taxSavedUpTo: number }
  | { ok: false; reason: "noConsent" | "invalidAmount" | "notEnoughMoney" };

export type PensionResult =
  | { ok: true; contribution: PensionContribution; deductible: number; taxSavedUpTo: number }
  | { ok: false; reason: "noConsent" | "invalidAmount" | "notEnoughMoney" };

export type EmergencyResult =
  | { ok: true; lock: LockState; released: number }
  | { ok: false; reason: "alreadyUsed" | "overLimit" | "notLocked" };

/* ─── Section 11: plan, Lock preview, the mirror ─────────────────────────── */

export interface GoalPlanInput {
  amount: number;
  saved: number;
  /** Months until the date the user picked (UI turns the date into months). */
  monthsLeft: number;
}

export interface GoalPlan {
  /** Lei a month needed to reach the goal by the date. */
  neededPerMonth: number;
  /** The chosen monthly Lock covers it. */
  fitsLock: boolean;
  /** Months to reach the goal with the chosen Lock; null if the Lock is 0. UI turns this into a date. */
  monthsWithLock: number | null;
}

export type UnlockReason = "health" | "bill" | "unexpected" | "want";

export interface UnlockRequest {
  amount: number;
  reason: UnlockReason;
  note?: string;
}

/** Stored for the month summary ("Last month you unlocked once for 'Something I want'"). */
export interface UnlockRecord {
  day: Day;
  amount: number;
  reason: UnlockReason;
  note?: string;
  path: "emergency" | "wait";
}

export type UnlockDecision =
  | { ok: true; path: "emergency"; lock: LockState; released: number; record: UnlockRecord }
  | { ok: true; path: "wait"; lock: LockState; releaseDay: Day; record: UnlockRecord }
  | { ok: false; reason: "notLocked" | "invalidAmount" };

export type PlanEditResult =
  | { kind: "applied"; settings: RitmSettings }
  | {
      /** The safe parts are applied; the lower Lock waits for the reason screen + 24h (requestUnlockWithReason). */
      kind: "needsUnlock";
      settings: RitmSettings;
      lockDecrease: number;
      requestedUnlockDay: Day;
    };
