import type { Transaction } from "@/lib/engine";

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
