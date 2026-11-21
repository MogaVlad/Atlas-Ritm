/**
 * Where kept money can go, for the unlock comparison (H5). Compared by risk, access to the money
 * and time horizon, never by return. Labels and one-line trade-offs live in messages/*.json;
 * these are the facts behind them.
 */

export type SavingsOptionId = "flexibleSavings" | "governmentBonds" | "pillar3";

export interface SavingsOption {
  id: SavingsOptionId;
  /** Deposits are guaranteed by the deposit guarantee fund; bonds by the state; pension funds follow the markets. */
  risk: "veryLow" | "low" | "medium";
  access: "anytime" | "atMaturity" | "atRetirement";
  horizon: "short" | "medium" | "long";
  /** An Atlas product (say so on screen). */
  atlasProduct: boolean;
  /** Choosing it must open the PensionExplainer first. */
  needsExplainer: boolean;
}

export const SAVINGS_OPTIONS: readonly SavingsOption[] = [
  { id: "flexibleSavings", risk: "veryLow", access: "anytime", horizon: "short", atlasProduct: true, needsExplainer: false },
  // Tezaur / Fidelis: Romanian government bonds, money back at maturity (1–5 years)
  { id: "governmentBonds", risk: "low", access: "atMaturity", horizon: "medium", atlasProduct: false, needsExplainer: false },
  // Atlas Pensii: Atlas's own fund; other funds can be compared on the ASF website
  { id: "pillar3", risk: "medium", access: "atRetirement", horizon: "long", atlasProduct: true, needsExplainer: true },
];
