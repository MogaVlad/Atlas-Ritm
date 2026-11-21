import { RULES } from "./config";
import type { PensionCheck, PensionCheckInput, PensionContribution, PensionSummary } from "./types";

/**
 * Pillar III (Atlas Pensii) rules. Only facts and checks: never a default, never a return estimate.
 * The explainer screen shows these numbers; the store calls checkPensionContribution before moving money.
 */

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Lei equivalent of the yearly deduction cap (400 EUR). */
export function pensionDeductibleLimit(): number {
  return Math.round(RULES.pension.deductibleEurPerYear * RULES.pension.eurToLei);
}

/** How much of `amount` is deductible, given what was already contributed this year, and the tax that saves. */
export function pensionTaxBenefit(amount: number, alreadyThisYear = 0): { deductible: number; taxSavedUpTo: number } {
  const left = Math.max(0, pensionDeductibleLimit() - Math.max(0, alreadyThisYear));
  const deductible = round2(Math.max(0, Math.min(amount, left)));
  return { deductible, taxSavedUpTo: round2(deductible * RULES.pension.incomeTax) };
}

/** Explicit consent first, then a positive amount the source can cover. */
export function checkPensionContribution(input: PensionCheckInput): PensionCheck {
  if (input.consent !== true) return { ok: false, reason: "noConsent" };
  const amount = round2(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, reason: "invalidAmount" };
  if (amount > input.available) return { ok: false, reason: "notEnoughMoney" };
  return { ok: true, amount, ...pensionTaxBenefit(amount, input.alreadyThisYear) };
}

export function pensionSummary(contributions: PensionContribution[]): PensionSummary {
  const total = round2(contributions.reduce((sum, c) => sum + c.amount, 0));
  const deductibleLimit = pensionDeductibleLimit();
  const deductibleUsed = Math.min(total, deductibleLimit);
  return {
    total,
    deductibleLimit,
    deductibleUsed,
    deductibleLeft: deductibleLimit - deductibleUsed,
    taxSavedUpTo: round2(deductibleUsed * RULES.pension.incomeTax),
  };
}
