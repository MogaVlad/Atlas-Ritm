"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { DEFAULT_RITM_SETTINGS, ESSENTIAL_AMOUNTS, GOAL, NET_SALARY } from "@/lib/data/persona";
import { historyFor, scenarioFor } from "@/lib/data/scenario";
import {
  alertActions,
  habitNote,
  lockSuggestion,
  planEdit,
  requestUnlockWithReason,
  usualDailySpend,
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
  type UnlockReason,
  type UnlockRecord,
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
  /** "habit": the extra pace is mostly the user's habits and the money lasts: the soft note (section 11 F). */
  variant?: "habit";
  /** The habits behind a soft note, biggest first. */
  habits?: string[];
}

/** Month 1 is the scripted first month; month 2 has month 1 as its history (habits, personal pace). */
export type DemoMonth = 1 | 2;

/** What editing the Lock did: applied now, or a lower Lock that needs a reason first (section 11 A). */
export type LockEditResult = { kind: "applied" } | { kind: "needsReason"; decrease: number } | { kind: "notLocked" };

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

export type { UnlockReason, UnlockRecord } from "@/lib/engine";

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
  /** The day-30 popup ("see how the month went") was answered; Reset demo shows it again. */
  summaryPromptSeen: boolean;
  /** The "your Lock is open" popup was answered for the current Lock; a new Lock shows it again. */
  lockPromptSeen: boolean;
  notifications: HeadsUpNotification[];
  /** Activity entries (salary, live payments) the user cleared from the notification centre. */
  clearedActivityIds: string[];
  alertMemory: AlertMemory;
  /** Every early exit from the Lock this month, with its reason (shown back in the summary). */
  unlockReasons: UnlockRecord[];
  /** Transfers between the user's own accounts (the Transfers tab), oldest first. */
  transfers: AccountTransfer[];
  /** Scripted payments declined because the current account couldn't cover them (never below 0). */
  declinedIds: string[];
  /** Which scripted month the demo is in. */
  month: DemoMonth;
  /** Month 1's early exits from the Lock, for month 2's summary ("Last month you unlocked..."). */
  lastMonthUnlocks: UnlockRecord[];
}

interface DerivedState {
  /** Every transaction of the month (scenario + added), with planned marks applied. Declined ones are not here. */
  transactions: Transaction[];
  /** Scripted payments the account couldn't cover, up to today: shown as declined, never charged. */
  declined: Transaction[];
  /** Engine output for demoDay. Recomputed after every change; read it, never set it. */
  pace: PaceState;
  balances: Balances;
  /** Totals for the pension explainer (no return estimates). */
  pension: PensionSummary;
  /** The month so far, for the day-30 summary screen. */
  summary: DaySummary;
  /** Month 2 only: last month's usual day and a Lock that fits real spending (the plan suggestion). */
  lastMonth: { usualDaily: number; suggestedLock: number } | null;
}

interface Actions {
  setLocale: (locale: Locale) => void;
  setDemoDay: (day: Day) => void;
  nextDay: () => void;
  addTransaction: (tx: Omit<Transaction, "id" | "day"> & Partial<Pick<Transaction, "id" | "day">>) => Transaction;
  /**
   * An in-store card payment from the "Simulate a card payment" sheet. Returns the current-account
   * balance before and after, and safe-to-spend today (null when Ritm is off), so the sheet can show
   * "1.104,00 lei → 1.087,00 lei".
   */
  payInStore: (purchase: Omit<Transaction, "id" | "day">) => InStoreResult;
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
  /**
   * Change the Lock (section 11 A). More money or a later day applies now (never more than the
   * current account holds). A lower amount returns needsReason: it goes through unlockWithReason.
   */
  editLock: (amount: number, unlockDay: Day) => LockEditResult;
  /**
   * Take `amount` out of the Lock with a reason (the mirror). Health, bill or unexpected, up to 300
   * lei, first time this month: released now. Otherwise released 24 h later; the rest stays locked.
   */
  unlockWithReason: (amount: number, reason: UnlockReason, note?: string) => "emergency" | "wait" | "notLocked";
  /** Demo: switch to month 1 or 2. Starts that month on day 0; settings and goals stay. */
  setMonth: (month: DemoMonth) => void;
  /** Early unlock of the whole Lock, released 24 h later. The reason is recorded. */
  requestUnlock: (reason?: UnlockReason, note?: string) => void;
  /** Up to 300 lei now, once a month (health, bill or unexpected cost). The reason is recorded. */
  emergencyRelease: (amount: number, reason?: UnlockReason, note?: string) => EmergencyResult;
  /** At unlock: keep `amount` in savings, the rest goes back to the current account. */
  keepSaved: (amount: number) => void;
  /**
   * Move money between the user's own accounts. Never more than the source holds: from savings,
   * money still in the Lock can't be moved (the Lock has its own unlock rules).
   */
  transferBetweenAccounts: (input: { from: AccountId; amount: number }) => TransferResult;
  /**
   * Pillar III contribution to Atlas Pensii. Never a default: `consent` must be true, which the
   * explainer sets only after its checkbox AND explicit button. "currentAccount" = the purchase
   * not made (Speed bump); "savings" = money kept at unlock (not money still in the Lock).
   */
  contributeToPension: (input: { amount: number; source: PensionSource; consent: boolean }) => PensionResult;
  setRaiseCommitment: (on: boolean) => void;
  /** Close the day-30 popup, whether the user opened the summary or chose "later". */
  dismissSummaryPrompt: () => void;
  /** Close the "your Lock is open" popup, whether the user chose what to do now or later. */
  dismissLockPrompt: () => void;
  /** Close a notification. `acted: false` counts it as ignored. */
  dismissNotification: (id: string, acted?: boolean) => void;
  /**
   * "Clear all" in the notification centre: closes every Heads-up and hides the activity shown so far.
   * Not counted as ignored (#59): one tap must not trigger the "suggest Speed bump" rule. Later activity still appears.
   */
  clearNotifications: () => void;
  resetDemo: () => void;
}

export interface InStoreResult {
  tx: Transaction;
  balanceBefore: number;
  balanceAfter: number;
  safeToSpendToday: number | null;
  /** The current account couldn't cover it: nothing was charged (a card never goes below zero). */
  declined: boolean;
}

export type AccountId = "current" | "savings";

export interface AccountTransfer {
  id: string;
  day: Day;
  from: AccountId;
  to: AccountId;
  amount: number;
}

export type TransferResult =
  | { ok: true; transfer: AccountTransfer; before: Balances; after: Balances }
  | { ok: false; reason: "invalidAmount" | "notEnoughMoney"; available: number };

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

function allTransactions(s: Pick<PersistedState, "added" | "plannedIds" | "declinedIds" | "month">): Transaction[] {
  const planned = new Set(s.plannedIds);
  const declined = new Set(s.declinedIds);
  return [...scenarioFor(s.month), ...s.added]
    .filter((t) => !declined.has(t.id))
    .map((t) => (planned.has(t.id) ? { ...t, planned: true } : t));
}

/** Current account at the end of `day`, as `derive` computes it. */
function currentBalance(s: PersistedState, day: Day): number {
  const flow = allTransactions(s)
    .filter((t) => t.day <= day)
    .reduce((sum, t) => sum - t.amount, 0);
  return OPENING_CURRENT + flow - (s.savings - OPENING_SAVINGS);
}

/**
 * Moving forward from `from` to `to`: each scripted payment on the days reached is charged only if
 * the current account covers it, otherwise it's declined, like a real card. So the scripted month
 * can never take the account below zero. Days re-lived after going back are settled again.
 */
function settleDays(s: PersistedState, from: Day, to: Day): PersistedState {
  if (to <= from) return s;
  const reached = scenarioFor(s.month).filter((t) => t.day > from && t.day <= to);
  const reachedIds = new Set(reached.map((t) => t.id));
  let next: PersistedState = { ...s, declinedIds: s.declinedIds.filter((id) => !reachedIds.has(id)) };
  for (let day = from + 1; day <= to; day++) {
    let balance = currentBalance(next, day - 1);
    const today = reached.filter((t) => t.day === day);
    // Money in first (salary, refunds), then the payments in order.
    balance -= today.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);
    for (const t of today.filter((t) => t.amount > 0)) {
      if (t.amount <= balance) balance -= t.amount;
      else next = { ...next, declinedIds: [...next.declinedIds, t.id] };
    }
  }
  return next;
}

/** The settings the engine sees: the Lock amount is what's actually locked now. */
function engineSettings(s: Pick<PersistedState, "ritm" | "lock">): RitmSettings {
  return { ...s.ritm, lock: { ...s.ritm.lock, amount: s.lock?.amount ?? 0 } };
}

function derive(s: PersistedState): DerivedState {
  const transactions = allTransactions(s);
  const declinedIds = new Set(s.declinedIds);
  const declined = scenarioFor(s.month).filter((t) => declinedIds.has(t.id) && t.day <= s.demoDay);
  const history = historyFor(s.month);
  const pace = computePace(transactions, engineSettings(s), s.demoDay, history);
  const flow = transactions.filter((t) => t.day <= s.demoDay).reduce((sum, t) => sum - t.amount, 0);
  const movedToSavings = s.savings - OPENING_SAVINGS;
  const balances = { current: OPENING_CURRENT + flow - movedToSavings, savings: s.savings };
  const pension = pensionSummary(s.pensionContributions);
  return {
    transactions,
    declined,
    pace,
    balances,
    pension,
    summary: {
      ...monthSummary(transactions, engineSettings(s), s.demoDay, history),
      keptSaved: balances.savings,
      pensionTotal: pension.total,
      currentBalance: balances.current,
    },
    lastMonth:
      history.length > 0
        ? { usualDaily: usualDailySpend(history, s.ritm), suggestedLock: lockSuggestion(history, s.ritm, NET_SALARY) }
        : null,
  };
}

/** Day changed or money moved: resolve the Lock, maybe queue a Heads-up. */
function evaluateDay(s: PersistedState): PersistedState {
  const next = { ...s };

  // The Lock moves its amount to savings on payday (day 1): never before the salary is in,
  // so starting Ritm on day 0 can't take the current account below zero. Created before it's
  // resolved, so a jump from day 0 straight to the unlock day opens it.
  if (next.ritm.enabled && !next.lock && next.ritm.lock.amount > 0 && next.demoDay >= 1) {
    const amount = Math.min(next.ritm.lock.amount, Math.max(0, currentBalance(next, next.demoDay)));
    if (amount > 0) {
      next.lock = createLock(amount, next.ritm.lock.unlockDay);
      next.lockPromptSeen = false;
      next.savings = next.savings + amount;
    }
  }
  if (next.lock) {
    const before = next.lock;
    next.lock = resolveLock(before, next.demoDay);
    // A partial early unlock came through: that part goes back to the current account now.
    if (before.status === "unlockRequested" && next.lock.status === "locked" && next.lock.amount < before.amount) {
      next.savings = next.savings - (before.amount - next.lock.amount);
    }
  }

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
  const history = historyFor(next.month);
  const transactions = allTransactions(next);
  const pace = computePace(transactions, engineSettings(next), next.demoDay, history);
  if (shouldNotify(pace, next.alertMemory, next.demoDay)) {
    const note = habitNote(pace, transactions, history, engineSettings(next), next.demoDay);
    next.notifications = [
      ...next.notifications,
      {
        id: `headsup-${next.demoDay}-${next.notifications.length + 1}`,
        kind: "headsUp",
        day: next.demoDay,
        severity: pace.severity,
        reasons: pace.reasons,
        // The soft note asks for nothing: it's the user's usual rhythm and the money lasts.
        actions: note.soft ? [] : alertActions(pace, next.alertMemory, next.lock?.unlockDay ?? next.ritm.lock.unlockDay),
        ...(note.soft ? { variant: "habit" as const, habits: note.merchants } : {}),
      },
    ];
    next.alertMemory = {
      ...next.alertMemory,
      lastNotifiedDay: next.demoDay,
      lastSeverity: pace.severity,
      lastPctSpent: pace.pctSpent,
    };
  }
  return next;
}

/** Month 1 in the demo script ends with one unlock for "Something I want" (section 11 F). */
const SCRIPTED_MONTH1_UNLOCKS: UnlockRecord[] = [{ day: 12, reason: "want", amount: 200, path: "wait" }];

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
  summaryPromptSeen: false,
  lockPromptSeen: false,
  notifications: [],
  clearedActivityIds: [],
  alertMemory: INITIAL_ALERT_MEMORY,
  unlockReasons: [],
  transfers: [],
  declinedIds: [],
  month: 1,
  lastMonthUnlocks: [],
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
  summaryPromptSeen: s.summaryPromptSeen,
  lockPromptSeen: s.lockPromptSeen,
  notifications: s.notifications,
  clearedActivityIds: s.clearedActivityIds,
  alertMemory: s.alertMemory,
  unlockReasons: s.unlockReasons,
  transfers: s.transfers,
  declinedIds: s.declinedIds,
  month: s.month,
  lastMonthUnlocks: s.lastMonthUnlocks,
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

        setDemoDay: (day) => update((s) => evaluateDay(settleDays({ ...s, demoDay: clampDay(day) }, s.demoDay, clampDay(day)))),

        nextDay: () =>
          update((s) => evaluateDay(settleDays({ ...s, demoDay: clampDay(s.demoDay + 1) }, s.demoDay, clampDay(s.demoDay + 1)))),

        payInStore: (purchase) => {
          const balanceBefore = get().balances.current;
          if (purchase.amount > balanceBefore) {
            const s = get();
            return {
              tx: { id: "declined", day: s.demoDay, ...purchase, channel: "card_in_store" },
              balanceBefore,
              balanceAfter: balanceBefore,
              safeToSpendToday: s.ritm.enabled ? s.pace.safeToSpendToday : null,
              declined: true,
            };
          }
          const tx = get().addTransaction({ ...purchase, channel: "card_in_store" });
          const after = get();
          return {
            tx,
            balanceBefore,
            balanceAfter: after.balances.current,
            safeToSpendToday: after.ritm.enabled ? after.pace.safeToSpendToday : null,
            declined: false,
          };
        },

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

        lockMoney: (wanted, unlockDay) =>
          update((s) => {
            // Never more than the current account holds.
            const amount = Math.min(wanted, Math.max(0, currentBalance(s, s.demoDay)));
            if (amount <= 0) return s;
            const lock = s.lock
              ? { ...s.lock, amount: s.lock.amount + amount }
              : createLock(amount, unlockDay ?? s.ritm.lock.unlockDay);
            return { ...s, lock, savings: s.savings + amount, lockPromptSeen: s.lock ? s.lockPromptSeen : false };
          }),

        editLock: (amount, unlockDay) => {
          const s = get();
          if (!s.lock || s.lock.status !== "locked") return { kind: "notLocked" };
          const old = { ...s.ritm, lock: { amount: s.lock.amount, unlockDay: s.lock.unlockDay } };
          const next = { ...old, lock: { amount, unlockDay: Math.max(unlockDay, s.lock.unlockDay) } };
          const result = planEdit(old, next, s.demoDay);
          if (result.kind === "needsUnlock") return { kind: "needsReason", decrease: result.lockDecrease };
          update((p) => {
            if (!p.lock) return p;
            // More money: never more than the current account holds.
            const more = Math.min(Math.max(0, amount - p.lock.amount), Math.max(0, currentBalance(p, p.demoDay)));
            const lock = { ...p.lock, amount: p.lock.amount + more, unlockDay: result.settings.lock.unlockDay };
            return { ...p, lock, savings: p.savings + more, ritm: { ...p.ritm, lock: { amount: lock.amount, unlockDay: lock.unlockDay } } };
          });
          return { kind: "applied" };
        },

        unlockWithReason: (amount, reason, note) => {
          const s = get();
          if (!s.lock) return "notLocked";
          const decision = requestUnlockWithReason(s.lock, s.demoDay, { amount, reason, note });
          if (!decision.ok) return "notLocked";
          update((p) => ({
            ...p,
            lock: decision.lock,
            savings: decision.path === "emergency" ? p.savings - decision.released : p.savings,
            unlockReasons: [...p.unlockReasons, decision.record],
          }));
          return decision.path;
        },

        setMonth: (month) =>
          update((s) => {
            if (s.month === month) return s;
            // Month 2 remembers month 1's Lock exits; with none, the scripted "Something I want" one.
            const lastMonthUnlocks: UnlockRecord[] =
              month === 2 ? (s.unlockReasons.length > 0 ? s.unlockReasons : SCRIPTED_MONTH1_UNLOCKS) : [];
            return {
              ...INITIAL,
              locale: s.locale,
              ritm: s.ritm,
              raiseCommitment: s.raiseCommitment,
              month,
              lastMonthUnlocks,
            };
          }),

        requestUnlock: (reason, note) =>
          update((s) => {
            if (!s.lock) return s;
            const record: UnlockRecord[] = reason ? [{ day: s.demoDay, reason, amount: s.lock.amount, note, path: "wait" }] : [];
            return { ...s, lock: requestEarlyUnlock(s.lock, s.demoDay), unlockReasons: [...s.unlockReasons, ...record] };
          }),

        emergencyRelease: (amount, reason, note) => {
          const s = get();
          if (!s.lock) return { ok: false, reason: "notLocked" };
          const result = releaseFromLock(s.lock, amount);
          if (result.ok) {
            const record: UnlockRecord[] = reason ? [{ day: s.demoDay, reason, amount: result.released, note, path: "emergency" }] : [];
            update((p) => ({
              ...p,
              lock: result.lock,
              savings: p.savings - result.released,
              unlockReasons: [...p.unlockReasons, ...record],
            }));
          }
          return result;
        },

        transferBetweenAccounts: ({ from, amount: wanted }) => {
          const s = get();
          const amount = Math.round(wanted * 100) / 100;
          const stillLocked = s.lock && s.lock.status !== "unlocked" ? s.lock.amount : 0;
          const available = Math.max(0, from === "current" ? s.balances.current : s.savings - stillLocked);
          if (!(amount > 0)) return { ok: false, reason: "invalidAmount", available };
          if (amount > available) return { ok: false, reason: "notEnoughMoney", available };

          const before = s.balances;
          const transfer: AccountTransfer = {
            id: `transfer-${s.transfers.length + 1}`,
            day: s.demoDay,
            from,
            to: from === "current" ? "savings" : "current",
            amount,
          };
          update((p) => ({
            ...p,
            savings: Math.round((p.savings + (from === "current" ? amount : -amount)) * 100) / 100,
            transfers: [...p.transfers, transfer],
          }));
          return { ok: true, transfer, before, after: get().balances };
        },

        keepSaved: (amount) =>
          update((s) => {
            if (!s.lock) return s;
            const kept = Math.max(0, Math.min(amount, s.lock.amount));
            const back = s.lock.amount - kept;
            return { ...s, lock: { ...s.lock, status: "unlocked", amount: kept }, savings: s.savings - back, lockPromptSeen: true };
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

        dismissSummaryPrompt: () => update((s) => ({ ...s, summaryPromptSeen: true })),

        dismissLockPrompt: () => update((s) => ({ ...s, lockPromptSeen: true })),

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
