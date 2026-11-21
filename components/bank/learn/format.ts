import type { Locale } from "@/lib/i18n";
import { altitudeOf } from "./content";

const NUM: Record<Locale, Intl.NumberFormat> = {
  ro: new Intl.NumberFormat("ro-RO"),
  en: new Intl.NumberFormat("en-GB"),
};

/** A level's altitude, "1.500 m" / "1,500 m". */
export function formatAltitude(level: number, locale: Locale): string {
  return `${NUM[locale].format(altitudeOf(level))} m`;
}
