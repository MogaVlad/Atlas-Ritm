import { dayToDate } from "@/lib/data/scenario";
import type { Day } from "@/lib/engine";
import type { Locale } from "@/lib/i18n";
import { DEMO_MONTH } from "./bankData";

const LONG: Record<Locale, Intl.DateTimeFormat> = {
  ro: new Intl.DateTimeFormat("ro-RO", { weekday: "long", day: "numeric", month: "long" }),
  en: new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }),
};

const SHORT: Record<Locale, Intl.DateTimeFormat> = {
  ro: new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "short" }),
  en: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }),
};

/** Day of the cycle → "1 nov." / "1 Nov". */
export function formatDayShort(day: Day, locale: Locale): string {
  return SHORT[locale].format(dayToDate(day, DEMO_MONTH));
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Day of the cycle → "Joi, 5 noiembrie" / "Thursday 5 November". */
export function formatDayLong(day: Day, locale: Locale): string {
  return capitalize(LONG[locale].format(dayToDate(day, DEMO_MONTH)));
}

/** "Azi" / "Ieri" relative to `today`, otherwise the long date. `t` is the useT() function. */
export function dayLabel(day: Day, today: Day, locale: Locale, t: (key: string) => string): string {
  if (day === today) return t("bank.transactions.today");
  if (day === today - 1) return t("bank.transactions.yesterday");
  return formatDayLong(day, locale);
}
