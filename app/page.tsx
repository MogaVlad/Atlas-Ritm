"use client";

import { LocaleToggle } from "@/components/bank/LocaleToggle";
import { PhoneFrame } from "@/components/bank/PhoneFrame";
import { formatLei } from "@/lib/format";
import { useHtmlLang, useLocale, useT } from "@/lib/i18n";

/** Temporary home: proves PhoneFrame, useT and formatLei work. Iustin replaces it in I1. */
export default function Home() {
  useHtmlLang();
  const t = useT();
  const locale = useLocale((s) => s.locale);

  return (
    <PhoneFrame>
      <header className="flex items-center justify-between px-5 pt-6">
        <span className="text-2xl font-semibold tracking-tight">{t("common.appName")}</span>
        <LocaleToggle />
      </header>
      <main className="flex flex-1 flex-col gap-6 px-5 pt-10">
        <h1 className="text-xl">{t("bank.home.greeting", { name: "Andrei" })}</h1>
        <section className="rounded-2xl bg-muted p-5">
          <p className="text-sm text-muted-foreground">{t("bank.home.balanceLabel")}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{formatLei(4800, locale)}</p>
        </section>
        <p className="text-sm text-muted-foreground">{t("bank.home.comingSoon")}</p>
      </main>
    </PhoneFrame>
  );
}
