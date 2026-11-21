import type { Locale } from "@/lib/i18n";

const DAY_MS = 86_400_000;
const toUtc = (iso: string) => new Date(`${iso}T00:00:00Z`);

const FORMATTERS: Record<Locale, Intl.DateTimeFormat> = {
  ro: new Intl.DateTimeFormat("ro-RO", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }),
  en: new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }),
};

/** Whole days from `date` to `today` (0 = same day). */
export function daysAgo(date: string, today: string): number {
  return Math.round((toUtc(today).getTime() - toUtc(date).getTime()) / DAY_MS);
}

/** "Joi, 5 noiembrie" / "Thursday, 5 November" */
export function formatDayLong(date: string, locale: Locale): string {
  const s = FORMATTERS[locale].format(toUtc(date));
  return s.charAt(0).toUpperCase() + s.slice(1);
}
