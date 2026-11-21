"use client";

import Link from "next/link";
import { useVisibleTransactions } from "@/components/bank/bankData";
import { LearnCard } from "@/components/bank/learn/LearnCard";
import { MonthHero } from "@/components/bank/MonthHero";
import { QuickActions } from "@/components/bank/QuickActions";
import { RitmSlot } from "@/components/bank/RitmSlot";
import { TransactionRow } from "@/components/bank/TransactionRow";
import { useWelcome } from "@/components/bank/welcomeGuide";
import { useT } from "@/lib/i18n";

/**
 * Home: the month header (balance, where you are between paydays), what you can do,
 * Ritm, the latest money in and out, and where you are in Learn.
 */
export default function HomePage() {
  const t = useT();
  const recent = useVisibleTransactions().slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <MonthHero />

      <QuickActions />

      <RitmSlot />

      <section aria-labelledby="recent-title">
        <div className="flex items-center justify-between">
          <h2 id="recent-title" className="font-display text-lg font-semibold">
            {t("bank.home.recentTitle")}
          </h2>
          {recent.length > 0 && (
            <Link
              href="/transactions"
              className="-mr-2 flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-atlas-pine underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-atlas-pine"
            >
              {t("bank.home.seeAll")}
            </Link>
          )}
        </div>
        {recent.length > 0 ? (
          <ul className="mt-1 divide-y divide-atlas-line">
            {recent.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </ul>
        ) : (
          // Day 0 (before the first payday): say why the list is empty and where the story starts.
          <div className="mt-3 rounded-2xl border border-dashed border-atlas-line p-5 text-center">
            <p className="text-sm leading-relaxed text-atlas-muted">{t("bank.home.emptyRecent")}</p>
            <button
              type="button"
              onClick={() => useWelcome.getState().show()}
              className="mt-2 min-h-11 rounded-full px-4 text-sm font-medium text-atlas-pine underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-atlas-pine"
            >
              {t("bank.home.emptyRecentCta")}
            </button>
          </div>
        )}
      </section>

      <LearnCard />
    </div>
  );
}
