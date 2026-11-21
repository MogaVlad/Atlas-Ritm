import { create } from "zustand";
import type { Transaction } from "@/lib/engine";
import { useBank } from "@/lib/store/useBank";

/** The live purchases of the demo (journey step 5 and the in-store tap). Merchants are fictional. */
export type Purchase = Omit<Transaction, "id" | "day">;

/** Day 6: the online jacket that meets the Speed bump. */
export const MODAHUB_JACKET: Purchase = {
  amount: 300,
  merchant: "ModaHub",
  category: "shopping",
  channel: "card_online",
};

/** An in-store card tap: can't be paused, gets a feedback toast instead. */
export const CAFE_TAP: Purchase = {
  amount: 180,
  merchant: "Cafeneaua Nord",
  category: "eating_out",
  channel: "card_in_store",
};

/** Shops offered by "Simulate a purchase" in the demo tools. The amount and channel are picked there. */
export const SIMULATED_SHOPS: readonly Pick<Purchase, "merchant" | "category" | "amount">[] = [
  { merchant: MODAHUB_JACKET.merchant, category: MODAHUB_JACKET.category, amount: MODAHUB_JACKET.amount },
  { merchant: "FoodGo", category: "food_delivery", amount: 85 },
  { merchant: "TechPunct", category: "electronics", amount: 450 },
  { merchant: CAFE_TAP.merchant, category: CAFE_TAP.category, amount: 17 },
];

/**
 * The online purchase Atlas's approval screen asks about: the ModaHub jacket, or one set up in
 * the demo tools. Not saved: a reload goes back to the jacket.
 */
export const usePendingPurchase = create<{ purchase: Purchase; setPurchase: (purchase: Purchase) => void }>((set) => ({
  purchase: MODAHUB_JACKET,
  setPurchase: (purchase) => set({ purchase }),
}));

/** A card payment can't take the current account below zero. */
export function canAfford(amount: number): boolean {
  return amount <= useBank.getState().balances.current;
}
