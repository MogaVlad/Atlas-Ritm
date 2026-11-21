import { describe, expect, it } from "vitest";
import { SAVINGS_OPTIONS } from "@/lib/data/savingsOptions";
import { checkPensionContribution, pensionDeductibleLimit, pensionSummary, pensionTaxBenefit } from "./index";

const base = { amount: 300, consent: true, available: 1000, alreadyThisYear: 0 };

describe("pension rules", () => {
  it("the deduction cap is 400 EUR in lei", () => {
    expect(pensionDeductibleLimit()).toBe(2000);
  });

  it("tax saved is 10% of the deductible part, capped for the year", () => {
    expect(pensionTaxBenefit(300)).toEqual({ deductible: 300, taxSavedUpTo: 30 });
    expect(pensionTaxBenefit(500, 1800)).toEqual({ deductible: 200, taxSavedUpTo: 20 });
    expect(pensionTaxBenefit(100, 2500)).toEqual({ deductible: 0, taxSavedUpTo: 0 });
  });

  it("never moves money without explicit consent", () => {
    expect(checkPensionContribution({ ...base, consent: false })).toEqual({ ok: false, reason: "noConsent" });
  });

  it("rejects empty, negative or uncovered amounts", () => {
    expect(checkPensionContribution({ ...base, amount: 0 })).toEqual({ ok: false, reason: "invalidAmount" });
    expect(checkPensionContribution({ ...base, amount: -5 })).toEqual({ ok: false, reason: "invalidAmount" });
    expect(checkPensionContribution({ ...base, amount: Number.NaN })).toEqual({ ok: false, reason: "invalidAmount" });
    expect(checkPensionContribution({ ...base, amount: 1200 })).toEqual({ ok: false, reason: "notEnoughMoney" });
  });

  it("accepts a covered amount with consent", () => {
    expect(checkPensionContribution(base)).toEqual({ ok: true, amount: 300, deductible: 300, taxSavedUpTo: 30 });
  });

  it("sums contributions and what's left of the deduction", () => {
    const s = pensionSummary([
      { id: "a", day: 6, amount: 300, source: "currentAccount" },
      { id: "b", day: 20, amount: 500, source: "savings" },
    ]);
    expect(s).toEqual({ total: 800, deductibleLimit: 2000, deductibleUsed: 800, deductibleLeft: 1200, taxSavedUpTo: 80 });
  });
});

describe("savings options for the unlock comparison", () => {
  it("compares by risk, access and horizon; only Pillar III needs the explainer", () => {
    expect(SAVINGS_OPTIONS.map((o) => o.id)).toEqual(["flexibleSavings", "governmentBonds", "pillar3"]);
    expect(SAVINGS_OPTIONS.filter((o) => o.needsExplainer).map((o) => o.id)).toEqual(["pillar3"]);
    expect(SAVINGS_OPTIONS.every((o) => !("return" in o))).toBe(true);
  });
});
