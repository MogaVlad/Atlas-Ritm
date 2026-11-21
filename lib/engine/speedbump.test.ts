import { describe, expect, it } from "vitest";
import { goalImpactDays } from "./speedbump";

describe("goalImpactDays", () => {
  it("turns a purchase into days of saving for the goal, rounded up", () => {
    // 500 lei a month over 30 days ≈ 16,67 lei a day: 300 lei is 18 days.
    expect(goalImpactDays(300, 500, 30)).toBe(18);
  });

  it("is null when nothing is saved a month", () => {
    expect(goalImpactDays(300, 0, 30)).toBeNull();
  });
});
