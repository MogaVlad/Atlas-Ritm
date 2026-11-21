import type { Category, PaceState, RitmSettings, Transaction } from "./types";

const NEVER_PAUSED: ReadonlySet<Category> = new Set(["salary", "own_transfer", "savings", "pension"]);

/**
 * Should this payment pause on the Speed bump before Confirm?
 * Only for online card or in-app payments (transfer), non-essential, not planned,
 * amount ≥ threshold, with Ritm on and its Speed bump switched on.
 * In-store taps never pause (they get the feedback toast instead).
 * Switching the Speed bump off on payday is the store's job.
 */
export function shouldShowSpeedBump(tx: Transaction, settings: RitmSettings, state: PaceState): boolean {
  void state; // reserved: the pace could tune the trigger later (pilot)
  return (
    settings.enabled &&
    settings.speedBump &&
    (tx.channel === "card_online" || tx.channel === "transfer") &&
    !tx.planned &&
    tx.amount >= settings.speedBumpThreshold &&
    !NEVER_PAUSED.has(tx.category) &&
    !settings.essentialCategories.includes(tx.category)
  );
}

/**
 * Days of saving for the main goal that a payment equals (the Speed bump's "why not now").
 * `monthlySaving` = what goes aside a month for it: the Lock amount, or what the goal needs a month.
 * Null when nothing goes aside.
 */
export function goalImpactDays(amount: number, monthlySaving: number, cycleLength: number): number | null {
  const perDay = monthlySaving / cycleLength;
  return perDay > 0 ? Math.ceil(amount / perDay) : null;
}
