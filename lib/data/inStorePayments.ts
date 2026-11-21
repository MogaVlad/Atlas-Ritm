import type { Transaction } from "@/lib/engine";

/** A payment the demo can make: the store adds the id and the day. */
export type DemoPurchase = Omit<Transaction, "id" | "day">;

/**
 * The in-store card payments offered in the "Simulate a card payment" sheet, small to large.
 * Fictional merchants; amounts are illustrative. In-store taps are never paused (no Speed bump).
 */
export const IN_STORE_PAYMENTS: readonly DemoPurchase[] = [
  { amount: 12, merchant: "PâineCaldă", category: "groceries", channel: "card_in_store" },
  { amount: 17, merchant: "Cafeneaua Nord", category: "eating_out", channel: "card_in_store" },
  { amount: 45, merchant: "FarmaNord", category: "health", channel: "card_in_store" },
  { amount: 64, merchant: "CineArt", category: "entertainment", channel: "card_in_store" },
  { amount: 86, merchant: "MarketColț", category: "groceries", channel: "card_in_store" },
  { amount: 180, merchant: "Cafeneaua Nord", category: "eating_out", channel: "card_in_store" },
];
