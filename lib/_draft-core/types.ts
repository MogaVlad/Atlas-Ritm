/** Date without time, always "YYYY-MM-DD". Core logic only uses these, so time zones can't break it. */
export type ISODate = string;

export type Locale = "ro" | "en";

export type Category =
  | "salary"
  | "rent"
  | "utilities"
  | "phone"
  | "transport"
  | "groceries"
  | "eating_out"
  | "shopping"
  | "entertainment"
  | "travel"
  | "health"
  | "pension"
  | "other";

/**
 * salary        income
 * fixed         recurring bills; outside the variable budget
 * discretionary everything else that leaves the account; counts against the budget
 * savings       money moved to savings or Pillar III; counts toward the savings goal
 */
export type TransactionKind = "salary" | "fixed" | "discretionary" | "savings";

export interface Transaction {
  id: string;
  date: ISODate;
  /** Always positive, RON. */
  amount: number;
  direction: "in" | "out";
  kind: TransactionKind;
  category: Category;
  merchant: string;
  /** Set when the transaction pays a known bill. */
  billId?: string;
}

export interface Bill {
  id: string;
  /** Translation key suffix, e.g. "rent" → t("bills.rent"). */
  id18n: string;
  amount: number;
  /** 1–31, clamped to the month length. */
  dayOfMonth: number;
  category: Category;
}

export interface Profile {
  name: string;
  age: number;
  city: string;
  netSalary: number;
  /** Day of month the salary arrives (1–31, clamped). */
  payday: number;
  /** Kept aside every cycle. */
  savingsGoal: number;
  bills: Bill[];
  /** Money left from the previous cycle when the demo starts. */
  openingBalance: number;
}

export interface Lock {
  id: string;
  amount: number;
  createdOn: ISODate;
  /** Released automatically on this date. */
  until: ISODate;
  /** Set by an early-unlock request; money is free from this date (cool-off). */
  earlyUnlockOn?: ISODate;
  status: "active" | "released";
}
