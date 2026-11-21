"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { DEFAULT_RITM_SETTINGS, ESSENTIAL_AMOUNTS, GOAL } from "@/lib/data/persona";
import { SCENARIO } from "@/lib/data/scenario";
import {
  alertActions,
  checkPensionContribution,
  computePace,
  createLock,
  emergencyRelease as releaseFromLock,
  essentialsTotal,
  INITIAL_ALERT_MEMORY,
  isValidGoal,
  monthSummary,
  pensionSummary,
  isRitmOffDue,
  requestUnlock as requestEarlyUnlock,
  resolveLock,
  ritmOffDay,
  RULES,
  shouldNotify,
  type AlertAction,
  type AlertMemory,
  type Category,
  type Day,
  type EmergencyResult,
  type Goal,
  type LockState,
  type MonthSummary,
  type PaceState,
  type PensionContribution,
  type PensionResult,
  type PensionSource,
  type PensionSummary,
  type Reason,
  type RitmFeature,
  type RitmSettings,
  type Severity,
  type Transaction,
} from "@/lib/engine";
import type { Locale } from "@/lib/i18n";

/** Current account before payday (illustrative, replace with sourced figure). */
export const OPENING_CURRENT = 150;
/** Savings account before payday (illustrative, replace with sourced figure). */
export const OPENING_SAVINGS = 0;

export interface HeadsUpNotification {
  id: string;
  kind: "headsUp";
  day: Day;
  severity: Severity;
  reasons: Reason[];
  actions: AlertAction[];
}

/** A purchase the user plans this month (onboarding step 2), e.g. shoes for 280 lei. */
export interface PlannedPurchase {
  name: string;
  amount: number;
}

/** The day-30 summary: the engine's month summary plus where the money is now. */
export interface DaySummary extends MonthSummary {
  /** Savings account now (money kept in the Lock included). */
  keptSaved: number;
  pensionTotal: number;
  currentBalance: number;
}

export interface Balances {
  current: number;
  savings: number;
}

interface PersistedState {
  locale: Locale;
  demoDay: Day;
  /** Transactions added live (the ModaHub jacket, in-store taps). The scenario itself is not stored. */
  added: Transaction[];
  /** Scenario or added transactions the user marked as planned. */
  plannedIds: string[];
  /** Planned purchases entered at onboarding. Shown by Ritm; not yet used by the engine. */
  plannedPurchases: PlannedPurchase[];
  ritm: RitmSettings;
  /** Day a requested turn-off takes effect (24 h after the request); null if none is pending. */
  ritmOffDay: Day | null;
  lock: LockState | null;
  savings: number;
  /** Pillar III contributions (Atlas Pensii). Each one is also a transfer in the transactions. */
  pensionContributions: PensionContribution[];
  /** Commitment card on day 30: "Next raise: save half of it automatically?" Off until the user turns it on. */
  raiseCommitment: boolean;
  notifications: HeadsUpNotification[];
  /** Activity entries (salary, live payments) the user cleared from the notification centre. */
  clearedActivityIds: string[];
  alertMemory: AlertMemory;
}

interface DerivedState {
  /** Every transaction of the month (scenario + added), with planned marks applied. */
  transactions: Transaction[];
  /** Engine output for demoDay. Recomputed after every change; read it, never set it. */
  pace: PaceState;
  balances: Balances;
  /** Totals for the pension explainer (no return estimates). */
  pension: PensionSummary;
  /** The month so far, for the day-30 summary screen. */
  summary: DaySummary;
}

interface Actions {
  setLocale: (locale: Locale) => void;
  setDemoDay: (day: Day) => void;
  nextDay: () => void;
  addTransaction: (tx: Omit<Transaction, "id" | "day"> & Partial<Pick<Transaction, "id" | "day">>) => Transaction;
  markPlanned: (txId: string) => void;
  enableRitm: (settings: RitmSettings, planned?: PlannedPurchase[]) => void;
  /** Switch Heads-up or the Speed bump on or off. */
  setFeature: (feature: RitmFeature, on: boolean) => void;
  /** Replace the savings goals (at least one, each valid). Returns false and changes nothing otherwise. */
  setGoals: (goals: Goal[]) => boolean;
  /** Turn Ritm off: it stays on until the next demo day (24 h rule). The Lock is not touched. */
  requestRitmOff: () => void;
  /** Keep Ritm on after all (cancels a pending turn-off). */
  cancelRitmOff: () => void;
  /** Online payments at or above this amount (lei) can meet the Speed bump. */
  setSpeedBumpThreshold: (lei: number) => void;
  /** Which categories are essentials; their monthly total is taken out of the spending money. */
  setEssentials: (categories: Category[]) => void;
  /** Move money to the Lock (creates it if needed). */
  lockMoney: (amount: number, unlockDay?: Day) => void;
  requestUnlock: () => void;
  emergencyRelease: (amount: number) => EmergencyResult;
  /** At unlock: keep `amount` in savings, the rest goes back to the current account. */
  keepSaved: (amount: number) => void;
  /**
   * Pillar III contribution to Atlas Pensii. Never a default: `consent` must be true, which the
   * explainer sets only after its checkbox AND explicit button. "currentAccount" = the purchase
   * not made (Speed bump); "savings" = money kept at unlock (not money still in the Lock).
   */
  contributeToPension: (input: { amount: number; source: PensionSource; consent: boolean }) => PensionResult;
  setRaiseCommitment: (on: boolean) => void;
  /** Close a notification. `acted: false` counts it as ignored. */
  dismissNotification: (id: string, acted?: boolean) => void;
  /**
   * "Clear all" in the notification centre: closes every Heads-up and hides the activity shown so far.
   * Not counted as ignored (#59): one tap must not trigger the "suggest Speed bump" rule. Later activity still appears.
   */
  clearNotifications: () => void;
  resetDemo: () => void;
}

export type BankState = PersistedState & DerivedState & Actions;

/* ─── helpers ─────────────────────────────────────────────────────────────── */

/** Day 0 is the day before payday (the demo starts there); day 1 is payday. */
const clampDay = (day: number) => Math.min(RULES.cycleLength, Math.max(0, Math.round(day)));

type SavedRitm = Partial<RitmSettings> & { goal?: { name: string; amount: number }; level?: "headsup" | "speedbump" | "lock" };

/**
 * Demos saved by older versions keep working:
 * - version 1 had one `goal` with no time: it becomes the first of `goals`, with the default time;
 * - versions 1–2 had one `level`: it becomes the Heads-up and Speed bump switches.
 */
export function migrateSaved(persisted: unknown, version: number): unknown {
  if (version >= 3 || !persisted || typeof persisted !== "object") return persisted;
  const saved = persisted as { ritm?: SavedRitm };
  if (!saved.ritm) return persisted;
  const { goal, level, ...ritm } = saved.ritm;
  if (goal && !ritm.goals) ritm.goals = [{ ...goal, months: GOAL.months }];
  if (level) {
    ritm.headsUp = true;
    ritm.speedBump = level !== "headsup";
  }
  return { ...saved, ritm };
}

function allTransactions(s: Pick<PersistedState, "added" | "plannedIds">): Transaction[] {
  const planned = new Set(s.plannedIds);
  return [...SCENARIO, ...s.added].map((t) => (planned.has(t.id) ? { ...t, planned: true } : t));
}

/** The settings the engine sees: the Lock amount is what's actually locked now. */
function engineSettings(s: Pick<PersistedState, "ritm" | "lock">): RitmSettings {
  return { ...s.ritm, lock: { ...s.ritm.lock, amount: s.lock?.amount ?? 0 } };
}

function derive(s: PersistedState): DerivedState {
  const transactions = allTransactions(s);
  const pace = computePace(transactions, engineSettings(s), s.demoDay);
  const flow = transactions.filter((t) => t.day <= s.demoDay).reduce((sum, t) => sum - t.amount, 0);
  const movedToSavings = s.savings - OPENING_SAVINGS;
  const balances = { current: OPENING_CURRENT + flow - movedToSavings, savings: s.savings };
  const pension = pensionSummary(s.pensionContributions);
  return {
    transactions,
    pace,
    balances,
    pension,
    summary: {
      ...monthSummary(transactions, engineSettings(s), s.demoDay),
      keptSaved: balances.savings,
      pensionTotal: pension.total,
      currentBalance: balances.current,
    },
  };
}

/** Day changed or money moved: resolve the Lock, maybe queue a Heads-up. */
function evaluateDay(s: PersistedState): PersistedState {
  const next = { ...s };

  // The Lock moves its amount to savings on payday (day 1): never before the salary is in,
  // so starting Ritm on day 0 can't take the current account below zero. Created before it's
  // resolved, so a jump from day 0 straight to the unlock day opens it.
  if (next.ritm.enabled && !next.lock && next.ritm.lock.amount > 0 && next.demoDay >= 1) {
    next.lock = createLock(next.ritm.lock.amount, next.ritm.lock.unlockDay);
    next.savings = next.savings + next.ritm.lock.amount;
  }
  if (next.lock) next.lock = resolveLock(next.lock, next.demoDay);

  // Payday again: the Speed bump switches off.
  if (next.demoDay === RULES.cycleLength && next.ritm.speedBump) {
    next.ritm = { ...next.ritm, speedBump: false };
  }

  // A requested turn-off comes into effect: Ritm goes quiet and its pending Heads-ups go away.
  if (isRitmOffDue(next.ritmOffDay, next.demoDay)) {
    next.ritm = { ...next.ritm, enabled: false };
    next.ritmOffDay = null;
    next.notifications = [];
  }

  if (!next.ritm.enabled || !next.ritm.headsUp) return next;
  const pace = computePace(allTransactions(next), engineSettings(next), next.demoDay);
  if (shouldNotify(pace, next.alertMemory, next.demoDay)) {
    next.notifications = [
      ...next.notifications,
      {
        id: `headsup-${next.demoDay}-${next.notifications.length + 1}`,
        kind: "headsUp",
        day: next.demoDay,
        severity: pace.severity,
        reasons: pace.reasons,
        actions: alertActions(pace, next.alertMemory),
      },
    ];
    next.alertMemory = { ...next.alertMemory, lastNotifiedDay: next.demoDay, lastSeverity: pace.severity };
  }
  return next;
}

const INITIAL: PersistedState = {
  locale: "en",
  demoDay: 0,
  added: [],
  plannedIds: [],
  plannedPurchases: [],
  ritm: DEFAULT_RITM_SETTINGS,
  ritmOffDay: null,
  lock: null,
  savings: OPENING_SAVINGS,
  pensionContributions: [],
  raiseCommitment: false,
  notifications: [],
  clearedActivityIds: [],
  alertMemory: INITIAL_ALERT_MEMORY,
};

/** localStorage that never throws (private windows, blocked storage, server render). */
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      /* storage unavailable: the demo still works, it just won't survive a reload */
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

const pick = (s: BankState): PersistedState => ({
  locale: s.locale,
  demoDay: s.demoDay,
  added: s.added,
  plannedIds: s.plannedIds,
  plannedPurchases: s.plannedPurchases,
  ritm: s.ritm,
  ritmOffDay: s.ritmOffDay,
  lock: s.lock,
  savings: s.savings,
  pensionContributions: s.pensionContributions,
  raiseCommitment: s.raiseCommitment,
  notifications: s.notifications,
  clearedActivityIds: s.clearedActivityIds,
  alertMemory: s.alertMemory,
});

/* ─── store ───────────────────────────────────────────────────────────────── */

export const useBank = create<BankState>()(
  persist(
    (set, get) => {
      /** Apply a change to the persisted part, then recompute everything derived. */
      const update = (change: (s: PersistedState) => PersistedState) => {
        const next = change(pick(get()));
        set({ ...next, ...derive(next) });
      };

      return {
        ...INITIAL,
        ...derive(INITIAL),

        setLocale: (locale) => update((s) => ({ ...s, locale })),

        setDemoDay: (day) => update((s) => evaluateDay({ ...s, demoDay: clampDay(day) })),

        nextDay: () => update((s) => evaluateDay({ ...s, demoDay: clampDay(s.demoDay + 1) })),

        addTransaction: (input) => {
          const s = get();
          const tx: Transaction = { id: `live-${s.added.length + 1}-${Date.now()}`, day: s.demoDay, ...input };
          update((p) => ({ ...p, added: [...p.added, tx] }));
          return tx;
        },

        markPlanned: (txId) =>
          update((s) => (s.plannedIds.includes(txId) ? s : { ...s, plannedIds: [...s.plannedIds, txId] })),

        enableRitm: (settings, planned = []) =>
          update((s) => {
            // The Lock itself is taken in evaluateDay: now if the salary is in, otherwise on payday.
            const next: PersistedState = {
              ...s,
              ritm: { ...settings, enabled: true },
              ritmOffDay: null,
              plannedPurchases: planned,
            };
            return evaluateDay(next);
          }),

        setFeature: (feature, on) => update((s) => evaluateDay({ ...s, ritm: { ...s.ritm, [feature]: on } })),

        setGoals: (goals) => {
          if (goals.length === 0 || goals.length > RULES.goals.maxGoals || !goals.every(isValidGoal)) return false;
          update((s) => ({ ...s, ritm: { ...s.ritm, goals } }));
          return true;
        },

        requestRitmOff: () =>
          update((s) => {
            if (!s.ritm.enabled || s.ritmOffDay !== null) return s;
            const next = { ...s, ritmOffDay: ritmOffDay(s.demoDay) };
            // Only re-evaluate if the delay is 0; otherwise asking to turn off changes nothing today.
            return isRitmOffDue(next.ritmOffDay, s.demoDay) ? evaluateDay(next) : next;
          }),

        cancelRitmOff: () => update((s) => ({ ...s, ritmOffDay: null })),

        setSpeedBumpThreshold: (lei) =>
          update((s) => ({ ...s, ritm: { ...s.ritm, speedBumpThreshold: Math.max(0, Math.round(lei)) } })),

        setEssentials: (categories) =>
          update((s) =>
            evaluateDay({
              ...s,
              ritm: {
                ...s.ritm,
                essentialCategories: categories,
                essentialsTotal: essentialsTotal(categories, ESSENTIAL_AMOUNTS),
              },
            }),
          ),

        lockMoney: (amount, unlockDay) =>
          update((s) => {
            if (amount <= 0) return s;
            const lock = s.lock
              ? { ...s.lock, amount: s.lock.amount + amount }
              : createLock(amount, unlockDay ?? s.ritm.lock.unlockDay);
            return { ...s, lock, savings: s.savings + amount };
          }),

        requestUnlock: () => update((s) => (s.lock ? { ...s, lock: requestEarlyUnlock(s.lock, s.demoDay) } : s)),

        emergencyRelease: (amount) => {
          const s = get();
          if (!s.lock) return { ok: false, reason: "notLocked" };
          const result = releaseFromLock(s.lock, amount);
          if (result.ok) update((p) => ({ ...p, lock: result.lock, savings: p.savings - result.released }));
          return result;
        },

        keepSaved: (amount) =>
          update((s) => {
            if (!s.lock) return s;
            const kept = Math.max(0, Math.min(amount, s.lock.amount));
            const back = s.lock.amount - kept;
            return { ...s, lock: { ...s.lock, status: "unlocked", amount: kept }, savings: s.savings - back };
          }),

        contributeToPension: ({ amount, source, consent }) => {
          const s = get();
          const stillLocked = s.lock && s.lock.status !== "unlocked" ? s.lock.amount : 0;
          const available = source === "currentAccount" ? s.balances.current : s.savings - stillLocked;
          const check = checkPensionContribution({
            amount,
            consent,
            available,
            alreadyThisYear: s.pension.total,
          });
          if (!check.ok) return check;

          const contribution: PensionContribution = {
            id: `pension-${s.pensionContributions.length + 1}-${Date.now()}`,
            day: s.demoDay,
            amount: check.amount,
            source,
          };
          // One transfer out of the current account. From savings, the money first comes back
          // to the current account (savings goes down), so the current balance stays the same.
          const transfer: Transaction = {
            id: contribution.id,
            day: s.demoDay,
            amount: check.amount,
            merchant: "Atlas Pensii",
            category: "pension",
            channel: "transfer",
          };
          update((p) => {
            const next: PersistedState = {
              ...p,
              added: [...p.added, transfer],
              pensionContributions: [...p.pensionContributions, contribution],
            };
            if (source === "savings") {
              next.savings = p.savings - check.amount;
              if (p.lock?.status === "unlocked") {
                next.lock = { ...p.lock, amount: Math.max(0, p.lock.amount - check.amount) };
              }
            }
            return next;
          });
          return { ok: true, contribution, deductible: check.deductible, taxSavedUpTo: check.taxSavedUpTo };
        },

        setRaiseCommitment: (on) => update((s) => ({ ...s, raiseCommitment: on })),

        dismissNotification: (id, acted = false) =>
          update((s) => ({
            ...s,
            notifications: s.notifications.filter((n) => n.id !== id),
            alertMemory: acted ? s.alertMemory : { ...s.alertMemory, ignoredCount: s.alertMemory.ignoredCount + 1 },
          })),

        clearNotifications: () =>
          update((s) => {
            const shown = [
              ...allTransactions(s).filter((t) => t.category === "salary" && t.day <= s.demoDay),
              ...s.added.filter((t) => t.day <= s.demoDay),
            ].map((t) => t.id);
            return {
              ...s,
              notifications: [],
              clearedActivityIds: [...new Set([...s.clearedActivityIds, ...shown])],
            };
          }),

        resetDemo: () => update(() => ({ ...INITIAL })),
      };
    },
    {
      name: "atlas-ritm-demo",
      version: 3,
      storage: createJSONStorage(() => safeStorage),
      partialize: pick,
      migrate: migrateSaved,
      // Rehydrated on the client by <BankHydrator/>, so the server HTML (day 0, EN) always matches.
      skipHydration: true,
      merge: (persisted, current) => {
        const next = { ...pick(current), ...(persisted as Partial<PersistedState>) };
        return { ...current, ...next, ...derive(next) };
      },
    },
  ),
);
