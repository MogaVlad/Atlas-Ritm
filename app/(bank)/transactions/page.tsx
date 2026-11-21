"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { daysAgo, formatDayLong } from "@/components/bank/dates";
import { MOCK_TODAY, sortedTransactions, type MockTransaction } from "@/components/bank/mockData";
import { TransactionRow } from "@/components/bank/TransactionRow";
import { useLocale, useT } from "@/lib/i18n";

function groupByDay(list: MockTransaction[]): [string, MockTransaction[]][] {
  const groups = new Map<string, MockTransaction[]>();
  for (const tx of list) groups.set(tx.date, [...(groups.get(tx.date) ?? []), tx]);
  return [...groups.entries()];
}

export default function TransactionsPage() {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const groups = groupByDay(sortedTransactions());

  const dayLabel = (date: string) => {
    const ago = daysAgo(date, MOCK_TODAY);
    if (ago === 0) return t("bank.transactions.today");
    if (ago === 1) return t("bank.transactions.yesterday");
    return formatDayLong(date, locale);
  };

  return (
    <div className="flex flex-col">
      <Link
        href="/"
        className="-ml-2 flex min-h-11 w-fit items-center gap-1 rounded-lg pr-3 pl-1 text-sm font-medium text-atlas-pine focus-visible:outline-2 focus-visible:outline-atlas-pine"
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
        {t("bank.nav.home")}
      </Link>
      <h1 className="mt-1 font-display text-[1.7rem] leading-tight font-semibold tracking-[-0.02em]">
        {t("bank.transactions.title")}
      </h1>

      {groups.length === 0 ? (
        <p className="mt-6 text-atlas-muted">{t("bank.transactions.empty")}</p>
      ) : (
        groups.map(([date, items]) => (
          <section key={date} aria-labelledby={`day-${date}`} className="mt-6">
            <h2 id={`day-${date}`} className="text-sm font-medium text-atlas-muted">
              {dayLabel(date)}
            </h2>
            <ul className="mt-1 divide-y divide-atlas-line">
              {items.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
