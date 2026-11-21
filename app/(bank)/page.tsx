"use client";

import { ChevronRight, PiggyBank } from "lucide-react";
import Link from "next/link";
import { BalancePanel } from "@/components/bank/BalancePanel";
import { CARD_LAST4, useBalances, useVisibleTransactions } from "@/components/bank/bankData";
import { RitmSlot } from "@/components/bank/RitmSlot";
import { SalaryMoment } from "@/components/bank/SalaryMoment";
import { TransactionRow } from "@/components/bank/TransactionRow";
import { GuideButton } from "@/components/bank/Welcome";
import { useWelcome } from "@/components/bank/welcomeGuide";
import { PERSONA } from "@/lib/data/persona";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";

export default function HomePage() {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const recent = useVisibleTransactions().slice(0, 5);
  const balances = useBalances();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[1.7rem] leading-tight font-semibold tracking-[-0.02em]">
          {t("bank.home.greeting", { name: PERSONA.name })}
        </h1>
        <GuideButton className="shrink-0" />
      </div>

      <SalaryMoment />

      <BalancePanel balance={balances.current} cardLast4={CARD_LAST4} href="/accounts/current" />

      <Link
        href="/accounts/savings"
        className="-mt-1 flex min-h-16 items-center gap-3 rounded-2xl border border-atlas-line bg-white px-5 py-3 transition-colors hover:border-atlas-pine/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine"
      >
        <PiggyBank className="size-5 text-atlas-pine" aria-hidden="true" />
        <span className="flex-1 text-sm text-atlas-muted">{t("bank.home.savingsLabel")}</span>
        <span className="font-medium tabular-nums">{formatLei(balances.savings, locale)}</span>
        <ChevronRight className="size-4 text-atlas-muted" aria-hidden="true" />
      </Link>

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
    </div>
  );
}
