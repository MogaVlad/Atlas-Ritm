import type { Locale } from "./i18n";

// Same format in both languages (team decision): the currency code RON, so 1.234,56 RON everywhere.
const LEI = new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" });

/** 1.234,56 RON in RO and EN. `locale` is kept so callers don't change if we ever split the formats again. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function formatLei(amount: number, locale?: Locale): string {
  return `${LEI.format(amount)} RON`;
}
