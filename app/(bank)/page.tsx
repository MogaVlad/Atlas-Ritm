"use client";

import Link from "next/link";
import { BalancePanel } from "@/components/bank/BalancePanel";
import { MOCK_ACCOUNTS, sortedTransactions } from "@/components/bank/mockData";
import { RitmSlot } from "@/components/bank/RitmSlot";
import { TransactionRow } from "@/components/bank/TransactionRow";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";

export default function HomePage() {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const recent = sortedTransactions().slice(0, 5);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-[1.7rem] leading-tight font-semibold tracking-[-0.02em]">
        {t("bank.home.greeting", { name: "Andrei" })}
      </h1>

      <BalancePanel balance={MOCK_ACCOUNTS.currentBalance} cardLast4={MOCK_ACCOUNTS.cardLast4} />

      <section
        aria-labelledby="savings-label"
        className="-mt-1 flex items-center justify-between rounded-2xl border border-atlas-line bg-white px-5 py-4"
      >
        <p id="savings-label" className="text-sm text-atlas-muted">
          {t("bank.home.savingsLabel")}
        </p>
        <p className="font-medium tabular-nums">{formatLei(MOCK_ACCOUNTS.savingsBalance, locale)}</p>
      </section>

      <RitmSlot />

      <section aria-labelledby="recent-title">
        <div className="flex items-center justify-between">
          <h2 id="recent-title" className="font-display text-lg font-semibold">
            {t("bank.home.recentTitle")}
          </h2>
          <Link
            href="/transactions"
            className="-mr-2 flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-atlas-pine underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-atlas-pine"
          >
            {t("bank.home.seeAll")}
          </Link>
        </div>
        <ul className="mt-1 divide-y divide-atlas-line">
          {recent.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} />
          ))}
        </ul>
      </section>
    </div>
  );
}
