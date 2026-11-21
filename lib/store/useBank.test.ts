import { IN_STORE_PAYMENTS } from "@/lib/data/inStorePayments";
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_RITM_SETTINGS, NET_SALARY } from "@/lib/data/persona";
import { shouldShowSpeedBump } from "@/lib/engine";
import { migrateSaved, OPENING_CURRENT, useBank } from "./useBank";

const store = () => useBank.getState();
const jacket = { amount: 300, merchant: "ModaHub", category: "shopping" as const, channel: "card_online" as const };

// Most tests start on payday (day 1); the demo itself starts the day before (day 0).
beforeEach(() => {
  store().resetDemo();
  store().setDemoDay(1);
});

describe("useBank", () => {
  it("starts on day 0, before payday: English, Ritm off, no salary yet", () => {
    store().resetDemo();
    expect(store().demoDay).toBe(0);
    expect(store().locale).toBe("en");
    expect(store().ritm.enabled).toBe(false);
    expect(store().notifications).toEqual([]);
    expect(store().balances.current).toBe(OPENING_CURRENT);
  });

  it("Ritm started on day 0 takes the Lock on payday, never before the salary", () => {
    store().resetDemo();
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    expect(store().lock).toBeNull();
    expect(store().balances.current).toBe(OPENING_CURRENT);
    store().setDemoDay(1);
    expect(store().lock?.amount).toBe(500);
    expect(store().balances.current).toBe(OPENING_CURRENT + 4800 - 260 - 500);
  });

  it("scripted payments the account can't cover are declined: the balance never goes below zero", () => {
    store().lockMoney(4000, 20); // leaves 690 lei on day 1
    for (let day = 2; day <= 30; day++) {
      store().nextDay();
      expect(store().balances.current, `day ${day}`).toBeGreaterThanOrEqual(0);
    }
    const rent = store().declined.find((t) => t.category === "rent");
    expect(rent?.day).toBe(2);
    expect(store().transactions.some((t) => t.id === rent?.id)).toBe(false);
  });

  it("a jump over many days settles them one by one, and going back then forward settles again", () => {
    store().lockMoney(4000, 20);
    store().setDemoDay(30);
    expect(store().balances.current).toBeGreaterThanOrEqual(0);
    const declinedOnce = store().declinedIds.length;
    store().setDemoDay(1);
    store().setDemoDay(30);
    expect(store().declinedIds).toHaveLength(declinedOnce);
  });

  it("the Lock never takes more than the current account holds", () => {
    store().resetDemo(); // day 0: 150 lei
    store().lockMoney(500, 20);
    expect(store().lock?.amount).toBe(OPENING_CURRENT);
    expect(store().balances.current).toBe(0);
  });

  it("the 'your Lock is open' popup waits for the Lock to open, once per Lock", () => {
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    expect(store().lock?.status).toBe("locked");
    store().setDemoDay(20);
    expect(store().lock?.status).toBe("unlocked");
    expect(store().lockPromptSeen).toBe(false);
    store().dismissLockPrompt();
    expect(store().lockPromptSeen).toBe(true);
    // Choosing what to do with the money also answers it.
    store().resetDemo();
    store().setDemoDay(1);
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    store().setDemoDay(20);
    store().keepSaved(500);
    expect(store().lockPromptSeen).toBe(true);
  });

  it("the Heads-up suggests what the days after the Lock opens need", () => {
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    store().setDemoDay(6);
    const move = store().notifications.at(-1)?.actions.find((a) => a.kind === "moveToLock");
    // Lock until day 20: 954 lei left ÷ 25 days × 11 days (20–30) → 410 lei, not a fixed 200.
    expect(move?.amount).toBe(410);
  });

  it("month 2: starts on payday, Ritm asks again, last month's Lock exits remembered", () => {
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    store().setDemoDay(5);
    store().requestUnlock("want");
    store().setMonth(2);
    expect(store().month).toBe(2);
    expect(store().demoDay).toBe(1);
    expect(store().ritm.enabled).toBe(false);
    expect(store().ritm.lock).toEqual(DEFAULT_RITM_SETTINGS.lock);
    expect(store().unlockReasons).toEqual([]);
    expect(store().lastMonthUnlocks.map((r) => r.reason)).toEqual(["want"]);
    expect(store().lastMonth?.suggestedLock).toBe(600);
  });

  it("month 2: keeping last month's settings turns Ritm on again, Speed bump included", () => {
    store().enableRitm({ ...DEFAULT_RITM_SETTINGS, speedBump: true });
    store().setDemoDay(30); // payday switches the Speed bump off for the day
    expect(store().ritm.speedBump).toBe(false);
    store().setMonth(2);
    expect(store().monthPromptSeen).toBe(false);
    store().keepLastMonthSettings();
    expect(store().monthPromptSeen).toBe(true);
    expect(store().ritm).toMatchObject({ enabled: true, headsUp: true, speedBump: true });
    expect(store().lock?.amount).toBe(DEFAULT_RITM_SETTINGS.lock.amount);
  });

  it("month 2 has no day 0", () => {
    store().setMonth(2);
    store().setDemoDay(0);
    expect(store().demoDay).toBe(1);
  });

  it("month 2 carries month 1's balances; a new Lock adds to the savings", () => {
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    store().setDemoDay(30);
    const end = store().balances;
    expect(end.savings).toBe(DEFAULT_RITM_SETTINGS.lock.amount);
    store().setMonth(2);
    expect(store().balances.savings).toBe(end.savings);
    expect(store().opening).toEqual(end);
    // Payday is in: the salary on top of what month 1 left (minus day 1's own payments).
    expect(store().balances.current).toBeGreaterThan(end.current + NET_SALARY - 200);
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    expect(store().lock?.amount).toBe(DEFAULT_RITM_SETTINGS.lock.amount);
    expect(store().balances.savings).toBe(end.savings + DEFAULT_RITM_SETTINGS.lock.amount);
  });

  it("month 2 day 6: the soft habit note instead of a Heads-up, asking for nothing", () => {
    store().setMonth(2);
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    store().setDemoDay(6);
    const note = store().notifications.at(-1);
    expect(note?.variant).toBe("habit");
    expect(note?.actions).toEqual([]);
    expect(note?.habits?.[0]).toBe("Mega Coș");
  });

  it("without month-1 exits, month 2 remembers the scripted 'Something I want' one", () => {
    store().setMonth(2);
    expect(store().lastMonthUnlocks).toEqual([{ day: 12, reason: "want", amount: 200, path: "wait" }]);
  });

  it("changing the Lock: more applies now, less needs a reason first", () => {
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    store().setDemoDay(5);
    expect(store().editLock(700, 22)).toEqual({ kind: "applied" });
    expect(store().lock).toMatchObject({ amount: 700, unlockDay: 22 });
    expect(store().ritm.lock).toEqual({ amount: 700, unlockDay: 22 });
    expect(store().editLock(400, 22)).toEqual({ kind: "needsReason", decrease: 300 });
    expect(store().lock?.amount).toBe(700);
  });

  it("lowering the Lock with 'Something I want' waits 24 h, then only that part comes out", () => {
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    store().setDemoDay(5);
    const savingsBefore = store().balances.savings;
    expect(store().unlockWithReason(200, "want")).toBe("wait");
    expect(store().lock?.status).toBe("unlockRequested");
    store().nextDay();
    expect(store().lock).toMatchObject({ status: "locked", amount: 300 });
    expect(store().balances.savings).toBe(savingsBefore - 200);
    expect(store().unlockReasons.at(-1)).toMatchObject({ reason: "want", amount: 200, path: "wait" });
  });

  it("money taken out of the Lock early keeps its reason", () => {
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    store().setDemoDay(5);
    expect(store().emergencyRelease(200, "health").ok).toBe(true);
    store().requestUnlock("want", "concert");
    expect(store().unlockReasons).toEqual([
      { day: 5, reason: "health", amount: 200, note: undefined, path: "emergency" },
      { day: 5, reason: "want", amount: 300, note: "concert", path: "wait" },
    ]);
  });

  it("with Heads-up switched off, Ritm sends no notifications", () => {
    store().enableRitm({ ...DEFAULT_RITM_SETTINGS, headsUp: false });
    store().setDemoDay(6);
    expect(store().notifications).toEqual([]);
    store().setFeature("headsUp", true);
    expect(store().notifications).toHaveLength(1);
  });

  it("salary arrives on day 1", () => {
    // 150 opening + 4800 salary − day-1 spending (80 + 90 + 64 + 26)
    expect(store().balances.current).toBe(OPENING_CURRENT + 4800 - 260);
  });

  it("enabling Ritm with a Lock moves 500 lei to savings", () => {
    const before = store().balances.current;
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    expect(store().ritm.enabled).toBe(true);
    expect(store().lock?.amount).toBe(500);
    expect(store().balances.savings).toBe(500);
    expect(store().balances.current).toBe(before - 500);
    expect(store().pace.pool).toBe(2120);
  });

  it("enableRitm keeps the planned purchases from onboarding; Reset clears them", () => {
    store().enableRitm(DEFAULT_RITM_SETTINGS, [{ name: "Pantofi", amount: 280 }]);
    expect(store().plannedPurchases).toEqual([{ name: "Pantofi", amount: 280 }]);
    store().resetDemo();
    expect(store().plannedPurchases).toEqual([]);
  });

  it("jumping to day 6 queues a spike Heads-up", () => {
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    store().setDemoDay(6);
    const n = store().notifications;
    expect(n).toHaveLength(1);
    expect(n[0].severity).toBe("spike");
    expect(n[0].reasons.map((r) => r.key)).toContain("ritm.reason.runOut");
    expect(n[0].actions.length).toBeGreaterThan(0);
  });

  it("no Heads-up while Ritm is off", () => {
    store().setDemoDay(6);
    expect(store().notifications).toEqual([]);
  });

  it("dismissing without acting counts as ignored", () => {
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    store().setDemoDay(6);
    store().dismissNotification(store().notifications[0].id);
    expect(store().notifications).toEqual([]);
    expect(store().alertMemory.ignoredCount).toBe(1);
  });

  it("clear all closes the Heads-ups and hides the activity shown so far", () => {
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    store().setDemoDay(6);
    const paid = store().addTransaction(jacket);
    store().clearNotifications();
    expect(store().notifications).toEqual([]);
    expect(store().alertMemory.ignoredCount).toBe(0); // clearing is not ignoring (#59)
    expect(store().clearedActivityIds).toContain(paid.id);
    expect(store().clearedActivityIds.some((id) => store().transactions.find((t) => t.id === id)?.category === "salary")).toBe(true);

    // Later activity still shows: a payment made after clearing is not in the list.
    store().setDemoDay(7);
    const later = store().addTransaction(jacket);
    expect(store().clearedActivityIds).not.toContain(later.id);

    // A new Heads-up after clearing still arrives (48h after the last one).
    store().setDemoDay(8);
    expect(store().notifications).toHaveLength(1);
  });

  it("the day-30 popup closes once and comes back after Reset demo", () => {
    expect(store().summaryPromptSeen).toBe(false);
    store().dismissSummaryPrompt();
    expect(store().summaryPromptSeen).toBe(true);
    store().resetDemo();
    expect(store().summaryPromptSeen).toBe(false);
  });

  it("an in-store payment returns the balance before and after", () => {
    store().setDemoDay(6);
    const coffee = IN_STORE_PAYMENTS.find((p) => p.amount === 17)!;
    const r = store().payInStore(coffee);
    expect(r.balanceBefore - r.balanceAfter).toBe(17);
    expect(r.balanceAfter).toBe(store().balances.current);
    expect(r.tx).toMatchObject({ day: 6, channel: "card_in_store", merchant: "Cafeneaua Nord" });
    expect(r.safeToSpendToday).toBeNull(); // Ritm off
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    expect(store().payInStore(coffee).safeToSpendToday).toBe(store().pace.safeToSpendToday);
  });

  it("transfers between accounts move money both ways, never more than is free", () => {
    store().setDemoDay(6);
    const start = store().balances;
    const toSavings = store().transferBetweenAccounts({ from: "current", amount: 200 });
    expect(toSavings.ok).toBe(true);
    expect(store().balances.current).toBe(start.current - 200);
    expect(store().balances.savings).toBe(start.savings + 200);

    const back = store().transferBetweenAccounts({ from: "savings", amount: 50 });
    expect(back.ok && back.after.current).toBe(start.current - 150);
    expect(store().transfers.map((t) => t.from)).toEqual(["current", "savings"]);

    expect(store().transferBetweenAccounts({ from: "current", amount: 0 })).toMatchObject({ ok: false, reason: "invalidAmount" });
    expect(store().transferBetweenAccounts({ from: "current", amount: 1e9 })).toMatchObject({ ok: false, reason: "notEnoughMoney" });
  });

  it("money in the Lock can't be transferred out of savings", () => {
    store().enableRitm(DEFAULT_RITM_SETTINGS); // Lock 500 until day 20
    store().setDemoDay(6);
    const r = store().transferBetweenAccounts({ from: "savings", amount: 100 });
    expect(r).toMatchObject({ ok: false, reason: "notEnoughMoney", available: 0 });
  });

  it("adding the jacket lowers safe to spend", () => {
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    store().setDemoDay(7);
    const before = store().pace.safeToSpendToday;
    const tx = store().addTransaction(jacket);
    expect(tx.day).toBe(7);
    expect(store().pace.safeToSpendToday).toBeLessThan(before);
  });

  it("marking a purchase planned takes it out of the pace", () => {
    store().setDemoDay(6);
    const spent = store().pace.spent;
    const tx = store().addTransaction(jacket);
    expect(store().pace.spent).toBe(spent + 300);
    store().markPlanned(tx.id);
    expect(store().pace.spent).toBe(spent);
  });

  it("Lock: emergency release once; money asked for early lands in the current account the next day", () => {
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    expect(store().emergencyRelease(300).ok).toBe(true);
    expect(store().balances.savings).toBe(200);
    expect(store().emergencyRelease(50)).toEqual({ ok: false, reason: "alreadyUsed" });

    store().setDemoDay(8);
    store().requestUnlock();
    expect(store().lock?.status).toBe("unlockRequested");
    store().nextDay();
    // Asked for, so no second choice: straight to the current account, no "Your Lock is open".
    expect(store().lock).toMatchObject({ status: "unlocked", amount: 0 });
    expect(store().balances.savings).toBe(0);
    expect(store().lockPromptSeen).toBe(true);
  });

  it("Lock: after an early unlock, putting money aside again locks it until the same day", () => {
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    store().setDemoDay(6);
    store().requestUnlock("want");
    store().nextDay();
    store().lockMoney(100);
    expect(store().lock).toMatchObject({ status: "locked", amount: 100, unlockDay: DEFAULT_RITM_SETTINGS.lock.unlockDay });
  });

  it("pension from the Speed bump: needs consent, then 300 lei leave the current account", () => {
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    store().setDemoDay(6);
    const before = store().balances.current;
    const spent = store().pace.spent;

    expect(store().contributeToPension({ amount: 300, source: "currentAccount", consent: false })).toEqual({
      ok: false,
      reason: "noConsent",
    });
    expect(store().balances.current).toBe(before);

    const r = store().contributeToPension({ amount: 300, source: "currentAccount", consent: true });
    expect(r.ok && r.taxSavedUpTo).toBe(30);
    expect(store().balances.current).toBe(before - 300);
    expect(store().pension.total).toBe(300);
    expect(store().pace.spent).toBe(spent); // a pension transfer is never counted as spending
    expect(store().transactions.at(-1)?.merchant).toBe("Atlas Pensii");
  });

  it("pension from savings: only money kept at unlock, not money still in the Lock", () => {
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    expect(store().contributeToPension({ amount: 100, source: "savings", consent: true })).toEqual({
      ok: false,
      reason: "notEnoughMoney",
    });

    store().setDemoDay(20);
    store().keepSaved(500);
    const current = store().balances.current;
    expect(store().contributeToPension({ amount: 200, source: "savings", consent: true }).ok).toBe(true);
    expect(store().balances.savings).toBe(300);
    expect(store().lock?.amount).toBe(300);
    expect(store().balances.current).toBe(current); // savings → pension, the current account is untouched
  });

  it("day-30 summary: spending money left, kept saved and pension, from the store", () => {
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    store().setDemoDay(20);
    store().keepSaved(500);
    store().contributeToPension({ amount: 100, source: "savings", consent: true });
    store().setDemoDay(30);
    const s = store().summary;
    expect(s.reachedPayday).toBe(true);
    expect(s.keptSaved).toBe(400);
    expect(s.pensionTotal).toBe(100);
    expect(s.currentBalance).toBe(store().balances.current);
    expect(s.points).toHaveLength(30);
  });

  it("the raise commitment is off until the user turns it on", () => {
    expect(store().raiseCommitment).toBe(false);
    store().setRaiseCommitment(true);
    expect(store().raiseCommitment).toBe(true);
    store().resetDemo();
    expect(store().raiseCommitment).toBe(false);
  });

  it("the Lock opens by itself on day 20", () => {
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    store().setDemoDay(19);
    expect(store().lock?.status).toBe("locked");
    store().setDemoDay(20);
    expect(store().lock?.status).toBe("unlocked");
  });

  it("the Speed bump switches off on payday (day 30)", () => {
    store().enableRitm({ ...DEFAULT_RITM_SETTINGS, speedBump: true });
    store().setDemoDay(30);
    expect(store().ritm.speedBump).toBe(false);
    expect(store().ritm.headsUp).toBe(true);
  });

  it("turning Ritm off takes effect a day later; its Heads-ups go, the Lock stays", () => {
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    store().setDemoDay(6);
    expect(store().notifications).toHaveLength(1);
    store().requestRitmOff();
    expect(store().ritm.enabled).toBe(true);
    expect(store().ritmOffDay).toBe(7);
    store().setDemoDay(7);
    expect(store().ritm.enabled).toBe(false);
    expect(store().ritmOffDay).toBeNull();
    expect(store().notifications).toEqual([]);
    expect(store().lock?.amount).toBe(500);
  });

  it("cancelling the turn-off keeps Ritm on", () => {
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    store().requestRitmOff();
    store().cancelRitmOff();
    store().setDemoDay(5);
    expect(store().ritm.enabled).toBe(true);
    expect(store().ritmOffDay).toBeNull();
  });

  it("a higher Speed bump threshold lets the 300-lei jacket through", () => {
    store().enableRitm({ ...DEFAULT_RITM_SETTINGS, speedBump: true });
    store().setDemoDay(6);
    const pending = { id: "pending", day: 6, ...jacket };
    expect(shouldShowSpeedBump(pending, store().ritm, store().pace)).toBe(true);
    store().setSpeedBumpThreshold(400);
    expect(store().ritm.speedBumpThreshold).toBe(400);
    expect(shouldShowSpeedBump(pending, store().ritm, store().pace)).toBe(false);
  });

  it("changing the essentials changes the spending money", () => {
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    store().setEssentials(["rent", "utilities", "transport"]);
    expect(store().ritm.essentialsTotal).toBe(2130);
    // 4800 salary − 2130 essentials − 500 Lock; the phone bill now counts as spending.
    expect(store().pace.pool).toBe(2170);
  });

  it("day stays within 0–30", () => {
    store().setDemoDay(45);
    expect(store().demoDay).toBe(30);
    store().setDemoDay(-3);
    expect(store().demoDay).toBe(0);
  });

  it("Reset demo goes back to day 0 with nothing added", () => {
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    store().setLocale("ro");
    store().setDemoDay(6);
    store().addTransaction(jacket);
    store().resetDemo();
    expect(store().demoDay).toBe(0);
    expect(store().locale).toBe("en");
    expect(store().added).toEqual([]);
    expect(store().notifications).toEqual([]);
    expect(store().lock).toBeNull();
    expect(store().pensionContributions).toEqual([]);
  });

  it("goals can be replaced with several, never with an invalid one", () => {
    const laptop = { name: "Laptop", amount: 4000, months: 8 };
    expect(store().setGoals([...DEFAULT_RITM_SETTINGS.goals, laptop])).toBe(true);
    expect(store().ritm.goals).toHaveLength(2);
    expect(store().setGoals([{ ...laptop, amount: -1 }])).toBe(false);
    expect(store().setGoals([])).toBe(false);
    expect(store().ritm.goals).toHaveLength(2);
  });

  it("a demo saved with one goal and one level (version 1) comes back with goals and switches", () => {
    const { goals, headsUp, speedBump, ...ritm } = DEFAULT_RITM_SETTINGS;
    void [goals, headsUp, speedBump];
    const saved = { demoDay: 6, ritm: { ...ritm, level: "speedbump", goal: { name: "Laptop", amount: 4000 } } };
    const migrated = migrateSaved(saved, 1) as { demoDay: number; ritm: Record<string, unknown> };
    expect(migrated.demoDay).toBe(6);
    expect(migrated.ritm.goals).toEqual([{ name: "Laptop", amount: 4000, months: 18 }]);
    expect(migrated.ritm).toMatchObject({ headsUp: true, speedBump: true });
    expect(migrated.ritm).not.toHaveProperty("goal");
    expect(migrated.ritm).not.toHaveProperty("level");
  });

  it("a demo saved with a level and goals (version 2) gets the switches", () => {
    const { headsUp, speedBump, ...ritm } = DEFAULT_RITM_SETTINGS;
    void [headsUp, speedBump];
    const migrated = migrateSaved({ ritm: { ...ritm, level: "headsup" } }, 2) as { ritm: Record<string, unknown> };
    expect(migrated.ritm).toMatchObject({ headsUp: true, speedBump: false, goals: DEFAULT_RITM_SETTINGS.goals });
  });
});
