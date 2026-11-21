import type { Locale } from "./i18n";

// Same format in both languages (team decision): the currency code RON, so 1.234,56 RON everywhere.
const LEI = new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" });

/** 1.234,56 RON in RO and EN. `locale` is kept so callers don't change if we ever split the formats again. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function formatLei(amount: number, locale?: Locale): string {
  return `${LEI.format(amount)} RON`;
}

/**
 * What an amount field keeps while you type: digits and one decimal separator (comma or point,
 * whichever the keyboard gives), at most 2 decimals. Minus signs, letters and "e" are dropped.
 */
export function cleanAmountInput(raw: string): string {
  const kept = raw.replace(/[^\d.,]/g, "");
  const sep = kept.search(/[.,]/);
  if (sep === -1) return kept;
  const whole = kept.slice(0, sep);
  const decimals = kept.slice(sep + 1).replace(/[.,]/g, "").slice(0, 2);
  return `${whole}${kept[sep]}${decimals}`;
}

/** The number in an amount field: "12,5" and "12.5" both give 12.5; empty gives 0. */
export function parseAmount(text: string): number {
  const value = Number(text.trim().replace(",", "."));
  return Number.isFinite(value) ? value : 0;
}
