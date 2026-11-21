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
}

export type RitmLevel = "headsup" | "speedbump" | "lock";

export interface RitmSettings {
  enabled: boolean;
  level: RitmLevel;
  /** Categories that never count (rent, utilities…). */
  essentialCategories: Category[];
  /** Lei per month, taken out of the spending money. */
  essentialsTotal: number;
  goal: { name: string; amount: number };
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
  /** Emergency release used this cycle (max once). */
  emergencyUsed: boolean;
}

/** What the alert logic remembers between days (lives in the store). */
export interface AlertMemory {
  lastNotifiedDay: Day | null;
  lastSeverity: Severity;
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

export type EmergencyResult =
  | { ok: true; lock: LockState; released: number }
  | { ok: false; reason: "alreadyUsed" | "overLimit" | "notLocked" };
