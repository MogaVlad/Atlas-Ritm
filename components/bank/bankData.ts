"use client";

import { useMemo } from "react";
import { PERSONA } from "@/lib/data/persona";
import type { Day, Transaction } from "@/lib/engine";
import { useBank } from "@/lib/store/useBank";

/** Bank-side read helpers over the useBank store (demo day, transactions, balances). */

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

/**
 * Transactions up to the demo day, newest first. Same day: the later entry first, using the
 * store's order (scenario, then live purchases), so a payment made just now is on top.
 */
export function useVisibleTransactions(): Transaction[] {
  const transactions = useBank((s) => s.transactions);
  const day = useBank((s) => s.demoDay);
  return useMemo(
    () =>
      transactions
        .map((t, order) => ({ t, order }))
        .filter(({ t }) => t.day <= day)
        .sort((a, b) => b.t.day - a.t.day || b.order - a.order)
        .map(({ t }) => t),
    [transactions, day],
  );
}

export function useDemoDay(): Day {
  return useBank((s) => s.demoDay);
}

export function useBalances() {
  return useBank((s) => s.balances);
}

/** Groups an already sorted list by day, keeping the order. */
export function groupByDay(list: Transaction[]): [Day, Transaction[]][] {
  const groups = new Map<Day, Transaction[]>();
  for (const t of list) groups.set(t.day, [...(groups.get(t.day) ?? []), t]);
  return [...groups.entries()];
}
