import { addDays } from "../dates";
import type { Category, ISODate, Profile, Transaction } from "../types";

/** Fictional persona. Numbers are placeholders until the pitcher sources them. */
export const PERSONA: Profile = {
  name: "Andrei",
  age: 27,
  city: "Cluj-Napoca",
  netSalary: 5500,
  payday: 10,
  savingsGoal: 500,
  openingBalance: 340,
  bills: [
    { id: "rent", id18n: "rent", amount: 2000, dayOfMonth: 10, category: "rent" },
    { id: "utilities", id18n: "utilities", amount: 300, dayOfMonth: 15, category: "utilities" },
    { id: "phone", id18n: "phone", amount: 60, dayOfMonth: 20, category: "phone" },
    { id: "transport", id18n: "transport", amount: 150, dayOfMonth: 1, category: "transport" },
  ],
};

/** Payday of the demo month: 10 Nov 2026 → next payday 10 Dec 2026 (30 days). */
export const DEMO_CYCLE_START: ISODate = "2026-11-10";

/** Named jumps for the hidden demo clock. Values are days after payday. */
export const DEMO_MILESTONES = { payday: 0, day6: 5, day20: 19 } as const;
export type DemoMilestone = keyof typeof DEMO_MILESTONES;

function buildSeed(): Transaction[] {
  let n = 0;
  const tx = (
    day: number,
    amount: number,
    merchant: string,
    category: Category,
    kind: Transaction["kind"] = "discretionary",
    billId?: string,
  ): Transaction => ({
    id: `seed-${String(++n).padStart(3, "0")}`,
    date: addDays(DEMO_CYCLE_START, day),
    amount,
    direction: kind === "salary" ? "in" : "out",
    kind,
    category,
    merchant,
    billId,
  });

  const list: Transaction[] = [
    tx(0, 5500, "Acme Software SRL", "salary", "salary"),
    tx(0, 2000, "Chirie", "rent", "fixed", "rent"),
    // Days 0–5: the payday splurge (888 RON → pace ≈ 1.8× on day 6)
    tx(0, 249, "eMAG", "shopping"),
    tx(0, 78, "Glovo", "eating_out"),
    tx(1, 156, "Kaufland", "groceries"),
    tx(1, 96, "Flying Circus Pub", "entertainment"),
    tx(3, 189, "Zara", "shopping"),
    tx(4, 64, "Glovo", "eating_out"),
    tx(5, 32, "Bolt", "transport"),
    tx(5, 24, "Olivo Café", "eating_out"),
    // Bills, on their due dates
    tx(5, 300, "Electrica + Digi", "utilities", "fixed", "utilities"),
    tx(10, 60, "Orange", "phone", "fixed", "phone"),
    tx(21, 150, "CTP Cluj", "transport", "fixed", "transport"),
  ];

  // Days 6–29: ordinary spending that, left alone, still overshoots the budget.
  for (let d = 6; d < 30; d++) {
    if (d % 3 === 0) list.push(tx(d, 118, "Lidl", "groceries"));
    if (d % 4 === 1) list.push(tx(d, 57, "Glovo", "eating_out"));
    if (d % 2 === 0) list.push(tx(d, 26, "Bolt", "transport"));
    if (d % 7 === 2) list.push(tx(d, 140, "Cinema City", "entertainment"));
    if (d === 13) list.push(tx(d, 210, "Answear", "shopping"));
  }
  return list;
}

export const SEED_TRANSACTIONS: Transaction[] = buildSeed();
