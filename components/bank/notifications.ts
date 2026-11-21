"use client";

import { useMemo } from "react";
import type { Day, Transaction } from "@/lib/engine";
import { useBank, type HeadsUpNotification } from "@/lib/store/useBank";

/**
 * Notification ids that already slid down as a banner in this tab. Module-level, so it
 * survives moving between Atlas and Ritm pages. Ids that leave the queue (dismissed, or
 * Reset demo) are pruned, so a rehearsal after Reset shows the day-6 banner again.
 */
const bannered = new Set<string>();

/** Newest Heads-up in the queue that hasn't been shown as a banner yet. Prunes stale ids. */
export function nextUnbannered(queue: HeadsUpNotification[]): HeadsUpNotification | null {
  const ids = new Set(queue.map((n) => n.id));
  for (const id of bannered) if (!ids.has(id)) bannered.delete(id);
  return queue.findLast((n) => !bannered.has(n.id)) ?? null;
}

export function markBannered(id: string) {
  bannered.add(id);
}

export type ActivityItem =
  | { kind: "salary"; id: string; day: Day; tx: Transaction }
  | { kind: "payment"; id: string; day: Day; tx: Transaction };

/**
 * The notification centre's history: salary payments and the payments made live in the demo,
 * up to the demo day, newest first. Heads-ups come straight from the store's queue.
 */
export function useActivity(): ActivityItem[] {
  const transactions = useBank((s) => s.transactions);
  const added = useBank((s) => s.added);
  const day = useBank((s) => s.demoDay);

  return useMemo(() => {
    const salary: ActivityItem[] = transactions
      .filter((t) => t.category === "salary" && t.day <= day)
      .map((tx) => ({ kind: "salary", id: tx.id, day: tx.day, tx }));
    const payments: ActivityItem[] = added
      .filter((t) => t.day <= day)
      .map((tx) => ({ kind: "payment", id: tx.id, day: tx.day, tx }));
    // Later entries first within a day: payments were made after the salary arrived.
    return [...salary, ...payments]
      .map((item, order) => ({ item, order }))
      .sort((a, b) => b.item.day - a.item.day || b.order - a.order)
      .map(({ item }) => item);
  }, [transactions, added, day]);
}
