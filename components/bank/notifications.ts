"use client";

import { useMemo } from "react";
import type { Day, Transaction } from "@/lib/engine";
import { useBank, type HeadsUpNotification } from "@/lib/store/useBank";

/**
 * Notification ids that already slid down as a banner in this tab. Kept in sessionStorage, so
 * a reload (or opening a page by its URL) doesn't slide the same Heads-up down again. Ids that
 * leave the queue (dismissed, or Reset demo) are pruned, so a rehearsal after Reset shows the
 * day-6 banner again. A new tab starts empty.
 */
const KEY = "atlas-bannered";
let cache: Set<string> | null = null;

function bannered(): Set<string> {
  if (cache) return cache;
  if (typeof window === "undefined") return new Set(); // server render: the queue is empty anyway
  try {
    cache = new Set(JSON.parse(window.sessionStorage.getItem(KEY) ?? "[]") as string[]);
  } catch {
    cache = new Set();
  }
  return cache;
}

function save(set: Set<string>) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify([...set]));
  } catch {
    /* storage blocked: the banner may show again after a reload, nothing worse */
  }
}

/** Newest Heads-up in the queue that hasn't been shown as a banner yet. Prunes stale ids. */
export function nextUnbannered(queue: HeadsUpNotification[]): HeadsUpNotification | null {
  const set = bannered();
  // Before the saved demo loads, the queue is always empty: pruning then would forget everything.
  if (useBank.persist.hasHydrated()) {
    const ids = new Set(queue.map((n) => n.id));
    let changed = false;
    for (const id of set) if (!ids.has(id)) changed = set.delete(id) || changed;
    if (changed) save(set);
  }
  return queue.findLast((n) => !set.has(n.id)) ?? null;
}

export function markBannered(id: string) {
  const set = bannered();
  if (set.has(id)) return;
  set.add(id);
  save(set);
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
  const cleared = useBank((s) => s.clearedActivityIds);

  return useMemo(() => {
    const hidden = new Set(cleared); // removed with "Clear all"
    const salary: ActivityItem[] = transactions
      .filter((t) => t.category === "salary" && t.day <= day && !hidden.has(t.id))
      .map((tx) => ({ kind: "salary", id: tx.id, day: tx.day, tx }));
    const payments: ActivityItem[] = added
      .filter((t) => t.day <= day && !hidden.has(t.id))
      .map((tx) => ({ kind: "payment", id: tx.id, day: tx.day, tx }));
    // Later entries first within a day: payments were made after the salary arrived.
    return [...salary, ...payments]
      .map((item, order) => ({ item, order }))
      .sort((a, b) => b.item.day - a.item.day || b.order - a.order)
      .map(({ item }) => item);
  }, [transactions, added, day, cleared]);
}
