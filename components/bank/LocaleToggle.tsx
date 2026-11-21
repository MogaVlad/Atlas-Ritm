"use client";

import { useLocale, useT, type Locale } from "@/lib/i18n";

const LOCALES: Locale[] = ["ro", "en"];

export function LocaleToggle() {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const setLocale = useLocale((s) => s.setLocale);

  return (
    <div role="group" aria-label={t("common.language")} className="flex rounded-full bg-muted p-1 text-sm font-medium">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className="min-h-11 min-w-11 rounded-full px-3 uppercase transition-colors focus-visible:outline-2 focus-visible:outline-ring aria-pressed:bg-background aria-pressed:shadow-sm"
        >
          {l}
        </button>
      ))}
    </div>
  );
}
