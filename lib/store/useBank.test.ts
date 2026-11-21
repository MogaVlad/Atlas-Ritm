import { IN_STORE_PAYMENTS } from "@/lib/data/inStorePayments";
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_RITM_SETTINGS } from "@/lib/data/persona";
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

  it("Lock: emergency release once, early unlock the next day, keep saved at unlock", () => {
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    expect(store().emergencyRelease(300).ok).toBe(true);
    expect(store().balances.savings).toBe(200);
    expect(store().emergencyRelease(50)).toEqual({ ok: false, reason: "alreadyUsed" });

    store().setDemoDay(8);
    store().requestUnlock();
    expect(store().lock?.status).toBe("unlockRequested");
    store().nextDay();
    expect(store().lock?.status).toBe("unlocked");

    store().keepSaved(150);
    expect(store().balances.savings).toBe(150);
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
