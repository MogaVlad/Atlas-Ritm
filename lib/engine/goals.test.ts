import { describe, expect, it } from "vitest";
import { goalMonthly, goalsPlan, isValidGoal } from "./goals";

const iceland = { name: "Islanda 2027", amount: 9000, months: 18 };
const laptop = { name: "Laptop", amount: 4000, months: 8 };

describe("goals", () => {
  it("splits a goal over its months, rounded up", () => {
    expect(goalMonthly(iceland)).toBe(500);
    expect(goalMonthly({ name: "Bike", amount: 1000, months: 3 })).toBe(334);
  });

  it("adds every goal and compares with 20% of the salary", () => {
    const plan = goalsPlan([iceland, laptop], 4800);
    expect(plan.monthly).toEqual([500, 500]);
    expect(plan.totalMonthly).toBe(1000);
    expect(plan.guidelineMonthly).toBe(960);
    expect(plan.shareOfSalary).toBeCloseTo(1000 / 4800);
    expect(plan.overGuideline).toBe(true);
  });

  it("stays within the guideline when the goals get more time", () => {
    expect(goalsPlan([iceland, { ...laptop, months: 10 }], 4800).overGuideline).toBe(false);
  });

  it("rejects goals with no name, no amount or an impossible time", () => {
    expect(isValidGoal(iceland)).toBe(true);
    expect(isValidGoal({ ...iceland, name: "  " })).toBe(false);
    expect(isValidGoal({ ...iceland, amount: -500 })).toBe(false);
    expect(isValidGoal({ ...iceland, amount: 0 })).toBe(false);
    expect(isValidGoal({ ...iceland, months: 0 })).toBe(false);
    expect(isValidGoal({ ...iceland, months: 61 })).toBe(false);
  });
});
