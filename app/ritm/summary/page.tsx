"use client";

import { LocaleToggle } from "@/components/bank/LocaleToggle";
import { MonthSummary } from "@/components/ritm/MonthSummary";
import { RitmBack } from "@/components/ritm/RitmBack";
import { useHtmlLang } from "@/lib/i18n";

/** Day 30 summary as a full page (from the Ritm tab). On Home it opens as a window instead. */
export default function SummaryScreen() {
  useHtmlLang();
  return (
    <>
      <header className="flex items-center justify-between gap-4 px-5 pt-3">
        <RitmBack />
        <LocaleToggle />
      </header>
      <main className="flex flex-1 flex-col px-5 pt-4 pb-8">
        <MonthSummary />
      </main>
    </>
  );
}
