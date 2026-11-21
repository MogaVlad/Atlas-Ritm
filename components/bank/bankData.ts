import { PERSONA } from "@/lib/data/persona";
import { SCENARIO, transactionsUntil } from "@/lib/data/scenario";
import type { Day, Transaction } from "@/lib/engine";

/**
 * Bank-side view of the synthetic data in lib/data. Read-only helpers for the Atlas screens.
 * TEMPORARY: the demo day is fixed until the useBank store + demo clock land (C5);
 * then screens read the day and transactions from the store instead.
 */
export const DEMO_DAY: Day = 6;

export type AccountId = "current" | "savings";

/** Fictional IBANs ("ATLS" is not a real bank code). */
export const ACCOUNTS: Record<AccountId, { iban: string }> = {
  current: { iban: "RO49 ATLS 0000 0716 0423 4821" },
  savings: { iban: "RO12 ATLS 0000 0716 0423 9077" },
};

export const CARD_LAST4 = PERSONA.cardLast4;

/**
 * The month the demo runs in (day 1 = 1 Nov 2026). Fixed, because Next (cacheComponents)
 * does not allow `new Date()` while rendering, and the dates must not jump at midnight mid-pitch.
 */
export const DEMO_MONTH = new Date(2026, 10, 1);

/** Up to `day`, newest first (same day: latest entry first). */
export function visibleTransactions(day: Day = DEMO_DAY): Transaction[] {
  return transactionsUntil(day).sort((a, b) => b.day - a.day || b.id.localeCompare(a.id));
}

/** Current account balance: money in minus money out (amounts are positive when money leaves). */
export function currentBalance(day: Day = DEMO_DAY): number {
  return -transactionsUntil(day).reduce((s, t) => s + t.amount, 0);
}

/** Savings start empty; the Lock moves money here once Ritm is on (store, C5). */
export function savingsBalance(): number {
  return 0;
}

export function findTransaction(id: string): Transaction | undefined {
  return SCENARIO.find((t) => t.id === id);
}

/** Groups an already sorted list by day, keeping the order. */
export function groupByDay(list: Transaction[]): [Day, Transaction[]][] {
  const groups = new Map<Day, Transaction[]>();
  for (const t of list) groups.set(t.day, [...(groups.get(t.day) ?? []), t]);
  return [...groups.entries()];
}
