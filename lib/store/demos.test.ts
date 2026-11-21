import { beforeEach, describe, expect, it } from "vitest";
import ro from "@/messages/ro.json";
import en from "@/messages/en.json";
import { DEMOS, startDemo } from "./demos";
import { useBank } from "./useBank";

const store = () => useBank.getState();

beforeEach(() => store().resetDemo());

describe("demo list", () => {
  it("every demo has a title and a line in both languages", () => {
    for (const d of DEMOS) {
      for (const m of [ro, en]) {
        const item = (m.common.demo.list as Record<string, { title: string; body: string }>)[d.id];
        expect(item?.title, `${d.id} title`).toBeTruthy();
        expect(item?.body, `${d.id} body`).toBeTruthy();
      }
    }
  });

  it("journey: day 1, Ritm off, nothing left over from before", () => {
    store().enableRitm({ ...store().ritm });
    store().setDemoDay(12);
    startDemo("journey", store);
    expect(store().demoDay).toBe(1);
    expect(store().ritm.enabled).toBe(false);
    expect(store().lock).toBeNull();
  });

  it("spike: day 6, Speed bump on, a Heads-up waiting", () => {
    startDemo("spike", store);
    expect(store().demoDay).toBe(6);
    expect(store().ritm.level).toBe("speedbump");
    expect(store().notifications.at(-1)?.severity).toBe("spike");
  });

  it("unlock: day 20, the Lock just opened", () => {
    startDemo("unlock", store);
    expect(store().demoDay).toBe(20);
    expect(store().lock?.status).toBe("unlocked");
  });

  it("payday: day 30, 500 lei kept saved", () => {
    startDemo("payday", store);
    expect(store().demoDay).toBe(30);
    expect(store().lock?.status).toBe("unlocked");
    expect(store().balances.savings).toBe(500);
  });

  it("keeps the language the pitch runs in", () => {
    store().setLocale("en");
    startDemo("spike", store);
    expect(store().locale).toBe("en");
  });
});
