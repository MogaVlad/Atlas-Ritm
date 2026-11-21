import { describe, expect, it } from "vitest";
import { RULES } from "./config";
import { essentialsTotal, isRitmOffDue, ritmOffDay } from "./settings";

describe("Ritm settings rules", () => {
  it("turning off takes effect 24 h (1 demo day) later", () => {
    expect(RULES.turnOffDelayDays).toBe(1);
    expect(ritmOffDay(6)).toBe(7);
    expect(isRitmOffDue(7, 6)).toBe(false);
    expect(isRitmOffDue(7, 7)).toBe(true);
    expect(isRitmOffDue(null, 30)).toBe(false);
  });

  it("essentials total sums only the chosen categories", () => {
    const monthly = { rent: 1800, utilities: 250, phone: 50, transport: 80 };
    expect(essentialsTotal(["rent", "utilities", "phone", "transport"], monthly)).toBe(2180);
    expect(essentialsTotal(["rent", "phone"], monthly)).toBe(1850);
    expect(essentialsTotal([], monthly)).toBe(0);
    expect(essentialsTotal(["groceries"], monthly)).toBe(0);
  });
});
