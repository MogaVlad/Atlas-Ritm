"use client";

import { BackLink } from "@/components/bank/BackLink";
import { useVisibleTransactions } from "@/components/bank/bankData";
import { TransactionList } from "@/components/bank/TransactionList";
import { useT } from "@/lib/i18n";

export default function TransactionsPage() {
  const t = useT();
  const transactions = useVisibleTransactions();

  return (
    <div className="flex flex-col">
      <BackLink href="/" label={t("bank.nav.home")} />
      <h1 className="mt-1 font-display text-[1.7rem] leading-tight font-semibold tracking-[-0.02em]">
        {t("bank.transactions.title")}
      </h1>
      <TransactionList transactions={transactions} />
    </div>
  );
}
