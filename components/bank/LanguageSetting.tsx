"use client";

import { Check, Languages } from "lucide-react";
import { useLocale, useT, type Locale } from "@/lib/i18n";

/** Each language is named in itself, so it reads right whichever one is active. */
const OPTIONS: { id: Locale; name: string }[] = [
  { id: "ro", name: "Română" },
  { id: "en", name: "English" },
];

/** Profile setting: the app's language (a choice, not a switch on every screen). */
export function LanguageSetting() {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const setLocale = useLocale((s) => s.setLocale);

  return (
    <section aria-labelledby="language-title" className="rounded-3xl bg-white p-5 ring-1 ring-atlas-line">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-atlas-sea text-atlas-pine" aria-hidden="true">
          <Languages className="size-5" />
        </span>
        <div>
          <h3 id="language-title" className="font-display text-lg font-semibold">
            {t("bank.profile.languageTitle")}
          </h3>
          <p className="text-sm text-atlas-muted">{t("bank.profile.languageHint")}</p>
        </div>
      </div>

      <div role="radiogroup" aria-labelledby="language-title" className="mt-4 flex flex-col divide-y divide-atlas-line">
        {OPTIONS.map((o) => {
          const selected = locale === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={selected}
              lang={o.id}
              onClick={() => setLocale(o.id)}
              className="flex min-h-12 items-center justify-between rounded-lg px-1 text-left font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine"
            >
              {o.name}
              {selected && <Check className="size-5 text-atlas-pine" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </section>
  );
}
