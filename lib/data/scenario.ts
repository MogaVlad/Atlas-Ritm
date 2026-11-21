import type { Category, Channel, Day, Transaction } from "@/lib/engine/types";
import { NET_SALARY, PERSONA, PHONE, RENT, TRANSPORT_PASS, UTILITIES } from "./persona";

/**
 * Luca's synthetic 30-day month. Day 1 is payday. Merchants are fictional.
 * All amounts are illustrative, replace with sourced figure.
 *
 * The story the demo needs (spending money = 2120 lei):
 * - days 1–2 stay under 20% spent → no alert yet
 * - day 5 (Friday) drifts above pace → "watch"
 * - day 6 (Saturday): bar + an online order → 1166 lei spent = 55% → "spike", Heads-up
 *   (at ~194 lei a day the money would run out on day 10, 20 days before payday)
 * - after day 6 spending calms down
 * - work shoes on day 9 are marked planned (never counted); a refund on day 10 (never counted)
 * The 300-lei ModaHub jacket on day 6 is NOT here: it is the live Speed bump purchase in the demo.
 */

let seq = 0;
function tx(
  day: Day,
  amount: number,
  merchant: string,
  category: Category,
  channel: Channel,
  extra: Partial<Transaction> = {},
): Transaction {
  seq += 1;
  return { id: `tx-${String(seq).padStart(3, "0")}`, day, amount, merchant, category, channel, ...extra };
}

function buildScenario(): Transaction[] {
  seq = 0;
  const list: Transaction[] = [
    // Day 1 — payday
    tx(1, -NET_SALARY, PERSONA.employer, "salary", "salary"),
    tx(1, TRANSPORT_PASS, "TransUrban Cluj", "transport", "card_online"),
    tx(1, 90, "Mega Coș", "groceries", "card_in_store"),
    tx(1, 64, "FoodGo", "food_delivery", "card_online"),
    tx(1, 26, "Cafeneaua Nord", "eating_out", "card_in_store"),
    // Day 2
    tx(2, RENT, "Chirie — proprietar", "rent", "transfer"),
    tx(2, 72, "FoodGo", "food_delivery", "card_online"),
    tx(2, 48, "StreamBox", "entertainment", "card_online"),
    // Day 3
    tx(3, PHONE, "FonPlus", "phone", "card_online"),
    tx(3, 100, "TechPunct", "electronics", "card_online"), // phone accessory
    // Day 4
    tx(4, 15, "Cafeneaua Nord", "eating_out", "card_in_store"),
    // Day 5 — Friday
    tx(5, UTILITIES, "EnergoCasa", "utilities", "transfer"),
    tx(5, 145, "Bar Nocturn", "entertainment", "card_in_store"),
    // Day 6 — Saturday: the spike
    tx(6, 81, "Mega Coș", "groceries", "card_in_store"),
    tx(6, 176, "Bar Nocturn", "entertainment", "card_in_store"),
    tx(6, 349, "StilNou", "shopping", "card_online"), // online fashion order
    // Day 9 — planned purchase, never counted
    tx(9, 280, "Pas Sigur", "shopping", "card_in_store", { planned: true }), // work shoes
    // Day 10 — partial refund from the StilNou order, never counted
    tx(10, -120, "StilNou", "shopping", "card_online"),
  ];

  // Days 7–30: calmer, ordinary spending.
  for (let d = 7; d <= 30; d++) {
    if (d % 3 === 0) list.push(tx(d, 55, "Mega Coș", "groceries", "card_in_store"));
    if (d % 2 === 1) list.push(tx(d, 12, "Cafeneaua Nord", "eating_out", "card_in_store"));
    if (d % 6 === 2) list.push(tx(d, 45, "FoodGo", "food_delivery", "card_online"));
    if (d === 13) list.push(tx(d, 60, "Bar Nocturn", "entertainment", "card_in_store"));
  }

  return list.sort((a, b) => a.day - b.day || a.id.localeCompare(b.id));
}

/** Every transaction of the demo month, sorted by day. */
export const SCENARIO: readonly Transaction[] = buildScenario();

/** Transactions up to and including `day` (what the demo clock shows on that day). */
export function transactionsUntil(day: Day): Transaction[] {
  return SCENARIO.filter((t) => t.day <= day);
}

/** Day of the cycle → a real date in the current month (day 1 = the 1st). For display only. */
export function dayToDate(day: Day, now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), day);
}
