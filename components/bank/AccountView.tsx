"use client";

import { PiggyBank } from "lucide-react";
import { BackLink } from "./BackLink";
import { BalancePanel } from "./BalancePanel";
import { ACCOUNTS, CARD_LAST4, useBalances, useVisibleTransactions, type AccountId } from "./bankData";
import { CopyIban } from "./CopyIban";
import { TransactionList } from "./TransactionList";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";

export function AccountView({ account }: { account: AccountId }) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const { iban } = ACCOUNTS[account];
  const balances = useBalances();
  const transactions = useVisibleTransactions();

  return (
    <div className="flex flex-col">
      <BackLink href="/" label={t("bank.nav.home")} />
      <h1 className="mt-1 mb-5 font-display text-[1.7rem] leading-tight font-semibold tracking-[-0.02em]">
        {t(account === "current" ? "bank.home.balanceLabel" : "bank.home.savingsLabel")}
      </h1>

      {account === "current" ? (
        <>
          <BalancePanel balance={balances.current} cardLast4={CARD_LAST4} label={t("bank.accounts.available")}>
            <CopyIban iban={iban} tone="dark" />
          </BalancePanel>
          <h2 className="mt-7 font-display text-lg font-semibold">{t("bank.accounts.history")}</h2>
          <div className="-mt-4">
            <TransactionList transactions={transactions} />
          </div>
        </>
      ) : (
        <>
          <section className="rounded-[28px] border border-atlas-line bg-white px-6 pt-5 pb-6">
            <p className="text-sm text-atlas-muted">{t("bank.accounts.savingsBalance")}</p>
            <p className="mt-2 font-display text-[2.6rem] leading-none font-semibold tracking-[-0.03em] tabular-nums">
              {formatLei(balances.savings, locale)}
            </p>
            <div className="mt-5 border-t border-atlas-line pt-4">
              <CopyIban iban={iban} />
            </div>
          </section>
          {balances.savings === 0 && (
            <div className="mt-6 flex gap-4 rounded-3xl bg-atlas-sea/60 p-5">
              <PiggyBank className="mt-0.5 size-6 shrink-0 text-atlas-pine" aria-hidden="true" />
              <p className="text-sm leading-relaxed text-atlas-ink">{t("bank.accounts.savingsEmpty")}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
