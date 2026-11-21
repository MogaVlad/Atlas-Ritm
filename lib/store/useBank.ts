"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { DEFAULT_RITM_SETTINGS } from "@/lib/data/persona";
import { SCENARIO } from "@/lib/data/scenario";
import {
  alertActions,
  computePace,
  createLock,
  emergencyRelease as releaseFromLock,
  INITIAL_ALERT_MEMORY,
  requestUnlock as requestEarlyUnlock,
  resolveLock,
  RULES,
  shouldNotify,
  type AlertAction,
  type AlertMemory,
  type Day,
  type EmergencyResult,
  type LockState,
  type PaceState,
  type Reason,
  type RitmLevel,
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
  lock: LockState | null;
  savings: number;
  notifications: HeadsUpNotification[];
  alertMemory: AlertMemory;
}

interface DerivedState {
  /** Every transaction of the month (scenario + added), with planned marks applied. */
  transactions: Transaction[];
  /** Engine output for demoDay. Recomputed after every change; read it, never set it. */
  pace: PaceState;
  balances: Balances;
}

interface Actions {
  setLocale: (locale: Locale) => void;
  setDemoDay: (day: Day) => void;
  nextDay: () => void;
  addTransaction: (tx: Omit<Transaction, "id" | "day"> & Partial<Pick<Transaction, "id" | "day">>) => Transaction;
  markPlanned: (txId: string) => void;
  enableRitm: (settings: RitmSettings, planned?: PlannedPurchase[]) => void;
  setLevel: (level: RitmLevel) => void;
  /** Move money to the Lock (creates it if needed). */
  lockMoney: (amount: number, unlockDay?: Day) => void;
  requestUnlock: () => void;
  emergencyRelease: (amount: number) => EmergencyResult;
  /** At unlock: keep `amount` in savings, the rest goes back to the current account. */
  keepSaved: (amount: number) => void;
  /** Close a notification. `acted: false` counts it as ignored. */
  dismissNotification: (id: string, acted?: boolean) => void;
  resetDemo: () => void;
}

export type BankState = PersistedState & DerivedState & Actions;

/* ─── helpers ─────────────────────────────────────────────────────────────── */

const clampDay = (day: number) => Math.min(RULES.cycleLength, Math.max(1, Math.round(day)));

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
  return {
    transactions,
    pace,
    balances: { current: OPENING_CURRENT + flow - movedToSavings, savings: s.savings },
  };
}

/** Day changed or money moved: resolve the Lock, maybe queue a Heads-up. */
function evaluateDay(s: PersistedState): PersistedState {
  const next = { ...s };
  if (next.lock) next.lock = resolveLock(next.lock, next.demoDay);

  // Payday again: the Speed bump level switches off.
  if (next.demoDay === RULES.cycleLength && next.ritm.level === "speedbump") {
    next.ritm = { ...next.ritm, level: "headsup" };
  }

  if (!next.ritm.enabled) return next;
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
  locale: "ro",
  demoDay: 1,
  added: [],
  plannedIds: [],
  plannedPurchases: [],
  ritm: DEFAULT_RITM_SETTINGS,
  lock: null,
  savings: OPENING_SAVINGS,
  notifications: [],
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
  lock: s.lock,
  savings: s.savings,
  notifications: s.notifications,
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
            let next: PersistedState = { ...s, ritm: { ...settings, enabled: true }, plannedPurchases: planned };
            if (settings.lock.amount > 0 && !s.lock) {
              next = {
                ...next,
                lock: createLock(settings.lock.amount, settings.lock.unlockDay),
                savings: next.savings + settings.lock.amount,
              };
            }
            return evaluateDay(next);
          }),

        setLevel: (level) => update((s) => evaluateDay({ ...s, ritm: { ...s.ritm, level } })),

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

        dismissNotification: (id, acted = false) =>
          update((s) => ({
            ...s,
            notifications: s.notifications.filter((n) => n.id !== id),
            alertMemory: acted ? s.alertMemory : { ...s.alertMemory, ignoredCount: s.alertMemory.ignoredCount + 1 },
          })),

        resetDemo: () => update(() => ({ ...INITIAL })),
      };
    },
    {
      name: "atlas-ritm-demo",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: pick,
      // Rehydrated on the client by <BankHydrator/>, so the server HTML (day 1, RO) always matches.
      skipHydration: true,
      merge: (persisted, current) => {
        const next = { ...pick(current), ...(persisted as Partial<PersistedState>) };
        return { ...current, ...next, ...derive(next) };
      },
    },
  ),
);
