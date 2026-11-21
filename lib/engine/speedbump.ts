import type { PaceState, RitmSettings, Transaction } from "./types";

/**
 * Should this payment pause on the Speed bump before Confirm?
 * Rule: card_online or transfer, non-essential, not planned, amount ≥ threshold,
 * Ritm on at level speedbump or lock.
 * TODO(C4): implement. Placeholder: the simple threshold check only.
 */
export function shouldShowSpeedBump(tx: Transaction, settings: RitmSettings, state: PaceState): boolean {
  void state;
  return settings.enabled && tx.channel === "card_online" && tx.amount >= settings.speedBumpThreshold;
}
