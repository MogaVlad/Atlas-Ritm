import { getCycle, occurrencesBetween, type Cycle } from "./dates";
import {
  computePace,
  computeSafeToSpend,
  detectSpike,
  evaluatePayment,
  totalLocked,
  type Pace,
  type SafeToSpend,
  type SpeedBump,
  type Spike,
} from "./engine";
import type { Category, ISODate, Lock, Profile, Transaction } from "./types";

export interface UpcomingBill {
  billId: string;
  amount: number;
  dueOn: ISODate;
}

export interface Snapshot {
  today: ISODate;
  cycle: Cycle;
  /** Transactions on or before today, newest first. */
  transactions: Transaction[];
  balance: number;
  locked: number;
  /** salary − bills − savings goal */
  budget: number;
  /** Discretionary spending this cycle. */
  spent: number;
  savedThisCycle: number;
  upcomingBills: UpcomingBill[];
  pace: Pace;
  safeToSpend: SafeToSpend;
  spike: Spike;
}

/**
 * The single source of every number the UI shows. UI code reads this; it never recomputes.
 */
export function computeSnapshot(p: {
  profile: Profile;
  today: ISODate;
  /** Seed + demo transactions, any order, any date (future ones are ignored). */
  transactions: Transaction[];
  locks: Lock[];
}): Snapshot {
  const { profile, today } = p;
  const cycle = getCycle(today, profile.payday);
  const visible = p.transactions.filter((t) => t.date <= today);
  const inCycle = visible.filter((t) => t.date >= cycle.start);
  const sum = (list: Transaction[]) => list.reduce((s, t) => s + t.amount, 0);

  const balance = profile.openingBalance + visible.reduce((s, t) => s + (t.direction === "in" ? t.amount : -t.amount), 0);
  const spent = sum(inCycle.filter((t) => t.kind === "discretionary" && t.direction === "out"));
  const savedThisCycle = sum(inCycle.filter((t) => t.kind === "savings" && t.direction === "out"));
  const budget = profile.netSalary - profile.bills.reduce((s, b) => s + b.amount, 0) - profile.savingsGoal;

  const paid = new Set(inCycle.map((t) => t.billId).filter(Boolean));
  const upcomingBills = profile.bills
    .filter((b) => !paid.has(b.id))
    .flatMap((b) => occurrencesBetween(today, cycle.nextPayday, b.dayOfMonth).map((dueOn) => ({ billId: b.id, amount: b.amount, dueOn })))
    .sort((a, b) => a.dueOn.localeCompare(b.dueOn));

  const locked = totalLocked(p.locks);

  return {
    today,
    cycle,
    transactions: [...visible].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
    balance,
    locked,
    budget,
    spent,
    savedThisCycle,
    upcomingBills,
    pace: computePace({ spent, budget, dayOfCycle: cycle.dayOfCycle, cycleLength: cycle.length }),
    safeToSpend: computeSafeToSpend({
      balance,
      locked,
      upcomingBills: upcomingBills.reduce((s, b) => s + b.amount, 0),
      savingsReserve: Math.max(0, profile.savingsGoal - savedThisCycle),
      daysLeft: cycle.daysLeft,
    }),
    spike: detectSpike({ transactions: inCycle, cycleStart: cycle.start, today, budget }),
  };
}

/** Call before confirming any simulated online payment: decides whether to show the speed bump. */
export function evaluatePaymentAttempt(s: Snapshot, payment: { amount: number; category: Category }): SpeedBump {
  return evaluatePayment({ ...payment, pace: s.pace, safeToSpend: s.safeToSpend, spike: s.spike, daysLeft: s.cycle.daysLeft });
}
