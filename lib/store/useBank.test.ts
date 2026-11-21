import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_RITM_SETTINGS } from "@/lib/data/persona";
import { OPENING_CURRENT, useBank } from "./useBank";

const store = () => useBank.getState();
const jacket = { amount: 300, merchant: "ModaHub", category: "shopping" as const, channel: "card_online" as const };

beforeEach(() => {
  store().resetDemo();
});

describe("useBank", () => {
  it("starts on day 1, Romanian, Ritm off, no notifications", () => {
    expect(store().demoDay).toBe(1);
    expect(store().locale).toBe("ro");
    expect(store().ritm.enabled).toBe(false);
    expect(store().notifications).toEqual([]);
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

  it("the Lock opens by itself on day 20", () => {
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    store().setDemoDay(19);
    expect(store().lock?.status).toBe("locked");
    store().setDemoDay(20);
    expect(store().lock?.status).toBe("unlocked");
  });

  it("the Speed bump level switches off on payday (day 30)", () => {
    store().enableRitm({ ...DEFAULT_RITM_SETTINGS, level: "speedbump" });
    store().setDemoDay(30);
    expect(store().ritm.level).toBe("headsup");
  });

  it("day stays within 1–30", () => {
    store().setDemoDay(45);
    expect(store().demoDay).toBe(30);
    store().setDemoDay(0);
    expect(store().demoDay).toBe(1);
  });

  it("Reset demo goes back to day 1 with nothing added", () => {
    store().enableRitm(DEFAULT_RITM_SETTINGS);
    store().setLocale("en");
    store().setDemoDay(6);
    store().addTransaction(jacket);
    store().resetDemo();
    expect(store().demoDay).toBe(1);
    expect(store().locale).toBe("ro");
    expect(store().added).toEqual([]);
    expect(store().notifications).toEqual([]);
    expect(store().lock).toBeNull();
  });
});
