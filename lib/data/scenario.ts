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

/**
 * Month 2: Luca has learned. No big spike. In the first week his habits come a bit
 * more often than usual (groceries and coffee every day), so the pace is above his usual day, but
 * the money lasts at his usual day from then on: Ritm sends the soft "your usual rhythm" note on
 * day 6 instead of a Heads-up. Then the month is calm. Same fictional merchants and amounts as
 * month 1, so his habits are recognised (Cafeneaua Nord ~12, Mega Coș ~55, FoodGo ~45).
 */
function buildMonth2(): Transaction[] {
  let n = 0;
  const m2 = (day: Day, amount: number, merchant: string, category: Category, channel: Channel): Transaction => ({
    id: `m2-${String(++n).padStart(3, "0")}`,
    day,
    amount,
    merchant,
    category,
    channel,
  });
  const list: Transaction[] = [
    m2(1, -NET_SALARY, PERSONA.employer, "salary", "salary"),
    m2(1, TRANSPORT_PASS, "TransUrban Cluj", "transport", "card_online"),
    m2(2, RENT, "Chirie — proprietar", "rent", "transfer"),
    m2(3, PHONE, "FonPlus", "phone", "card_online"),
    m2(5, UTILITIES, "EnergoCasa", "utilities", "transfer"),
  ];
  // Days 1–6: groceries and coffee every day, FoodGo twice, two extra coffees: 519 lei of habits.
  for (let d = 1; d <= 6; d++) {
    list.push(m2(d, 55, "Mega Coș", "groceries", "card_in_store"));
    list.push(m2(d, 12, "Cafeneaua Nord", "eating_out", "card_in_store"));
  }
  list.push(m2(2, 45, "FoodGo", "food_delivery", "card_online"));
  list.push(m2(4, 45, "FoodGo", "food_delivery", "card_online"));
  list.push(m2(6, 15, "Cafeneaua Nord", "eating_out", "card_in_store"));
  list.push(m2(6, 12, "Cafeneaua Nord", "eating_out", "card_in_store"));
  // Days 7–30: his usual rhythm, as in month 1.
  for (let d = 7; d <= 30; d++) {
    if (d % 3 === 0) list.push(m2(d, 55, "Mega Coș", "groceries", "card_in_store"));
    if (d % 2 === 1) list.push(m2(d, 12, "Cafeneaua Nord", "eating_out", "card_in_store"));
    if (d % 6 === 2) list.push(m2(d, 45, "FoodGo", "food_delivery", "card_online"));
    if (d === 13) list.push(m2(d, 60, "Bar Nocturn", "entertainment", "card_in_store"));
  }
  return list.sort((a, b) => a.day - b.day || a.id.localeCompare(b.id));
}

/** Month 2 of the demo (DemoControls → Month 2). Month 1 becomes its history. */
export const SCENARIO_MONTH_2: readonly Transaction[] = buildMonth2();

/** The scripted month the demo is in. */
export function scenarioFor(month: 1 | 2): readonly Transaction[] {
  return month === 2 ? SCENARIO_MONTH_2 : SCENARIO;
}

/** Last month's transactions (days 1–30), for habits and the personal pace; none in month 1. */
export function historyFor(month: 1 | 2): readonly Transaction[] {
  return month === 2 ? SCENARIO : [];
}

/** Transactions up to and including `day` (what the demo clock shows on that day). */
export function transactionsUntil(day: Day): Transaction[] {
  return SCENARIO.filter((t) => t.day <= day);
}

/** Day of the cycle → a real date in the current month (day 1 = the 1st). For display only. */
export function dayToDate(day: Day, now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), day);
}
