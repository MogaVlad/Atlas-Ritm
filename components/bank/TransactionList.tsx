"use client";

import type { Transaction } from "@/lib/engine";
import { useLocale, useT } from "@/lib/i18n";
import { DEMO_DAY, groupByDay } from "./bankData";
import { dayLabel } from "./dates";
import { TransactionRow } from "./TransactionRow";

/** Transactions grouped by day under "Azi", "Ieri", then the date. Expects a newest-first list. */
export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  const t = useT();
  const locale = useLocale((s) => s.locale);

  if (transactions.length === 0) {
    return <p className="mt-6 text-atlas-muted">{t("bank.transactions.empty")}</p>;
  }

  return groupByDay(transactions).map(([day, items]) => (
    <section key={day} aria-labelledby={`day-${day}`} className="mt-6">
      <h2 id={`day-${day}`} className="text-sm font-medium text-atlas-muted">
        {dayLabel(day, DEMO_DAY, locale, t)}
      </h2>
      <ul className="mt-1 divide-y divide-atlas-line">
        {items.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} />
        ))}
      </ul>
    </section>
  ));
}
