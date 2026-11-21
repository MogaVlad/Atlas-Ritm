/**
 * TEMPORARY mock for I1 (bank shell). Replace with the useBank store + lib/data (C3/C5) at Gate 2.
 * Numbers follow the persona in docs/ROADMAP.md: 4.800 lei salary on day 1, 2.180 lei essentials,
 * 500 lei Lock, 1.166 lei spent by day 6. All merchants are fictional.
 */

export type BankCategory =
  | "salary"
  | "rent"
  | "utilities"
  | "phone"
  | "transport"
  | "groceries"
  | "eatingOut"
  | "shopping"
  | "entertainment"
  | "savings";

export interface MockTransaction {
  id: string;
  /** "YYYY-MM-DD" */
  date: string;
  /** Positive = money in, negative = money out. */
  amount: number;
  merchant: string;
  category: BankCategory;
}

/** Demo "today" until the demo clock exists: day 6 of the cycle (payday on 1 Nov). */
export const MOCK_TODAY = "2026-11-06";

export const MOCK_ACCOUNTS = {
  currentBalance: 954,
  savingsBalance: 500,
  cardLast4: "4821",
};

export const MOCK_TRANSACTIONS: MockTransaction[] = [
  { id: "t01", date: "2026-11-01", amount: 4800, merchant: "Nordlogic SRL", category: "salary" },
  { id: "t02", date: "2026-11-01", amount: -1800, merchant: "Chirie apartament", category: "rent" },
  { id: "t03", date: "2026-11-01", amount: -500, merchant: "Atlas Economii", category: "savings" },
  { id: "t04", date: "2026-11-01", amount: -80, merchant: "Abonament transport", category: "transport" },
  { id: "t05", date: "2026-11-01", amount: -50, merchant: "Undă Mobil", category: "phone" },
  { id: "t06", date: "2026-11-01", amount: -142, merchant: "Bistro Someș", category: "eatingOut" },
  { id: "t07", date: "2026-11-01", amount: -64, merchant: "Cinema Lumina", category: "entertainment" },
  { id: "t08", date: "2026-11-02", amount: -168, merchant: "Piața Verde", category: "groceries" },
  { id: "t09", date: "2026-11-02", amount: -89, merchant: "Livrări Rapid", category: "eatingOut" },
  { id: "t10", date: "2026-11-03", amount: -279, merchant: "ModaHub", category: "shopping" },
  { id: "t11", date: "2026-11-04", amount: -38, merchant: "Cafeneaua Nord", category: "eatingOut" },
  { id: "t12", date: "2026-11-04", amount: -150, merchant: "Sala Puls", category: "entertainment" },
  { id: "t13", date: "2026-11-05", amount: -96, merchant: "Livrări Rapid", category: "eatingOut" },
  { id: "t14", date: "2026-11-05", amount: -74, merchant: "Piața Verde", category: "groceries" },
  { id: "t15", date: "2026-11-06", amount: -250, merchant: "Electro Nord", category: "utilities" },
  { id: "t16", date: "2026-11-06", amount: -66, merchant: "Bistro Someș", category: "eatingOut" },
];

/** Newest first. Same-day order keeps the later id on top. */
export function sortedTransactions(list: MockTransaction[] = MOCK_TRANSACTIONS): MockTransaction[] {
  return [...list].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}
