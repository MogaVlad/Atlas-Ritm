"use client";

import { ArrowDownUp, Lock, PiggyBank, Wallet } from "lucide-react";
import { useId, useState } from "react";
import { cleanAmountInput, formatLei, parseAmount } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { useBank, type AccountId, type TransferResult } from "@/lib/store/useBank";
import { cn } from "@/lib/utils";

const QUICK = [50, 100, 200, 500];

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine";

/** Move money between the current account and savings. Money still in the Lock stays put. */
export default function TransfersPage() {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const amountId = useId();
  const balances = useBank((s) => s.balances);
  const lock = useBank((s) => s.lock);
  const transfers = useBank((s) => s.transfers);
  const transfer = useBank((s) => s.transferBetweenAccounts);
  const [from, setFrom] = useState<AccountId>("current");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState<TransferResult | null>(null);

  const lei = (n: number) => formatLei(n, locale);
  const locked = lock && lock.status !== "unlocked" ? lock.amount : 0;
  const available = Math.max(0, from === "current" ? balances.current : balances.savings - locked);
  const value = parseAmount(amount);
  const accounts = from === "current" ? (["current", "savings"] as const) : (["savings", "current"] as const);

  const submit = () => {
    const r = transfer({ from, amount: value });
    setResult(r);
    if (r.ok) setAmount("");
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[1.7rem] leading-tight font-semibold tracking-[-0.02em]">{t("bank.transfers.title")}</h1>
        <p className="mt-1 text-atlas-muted">{t("bank.transfers.intro")}</p>
      </div>

      <section aria-label={t("bank.transfers.direction")} className="flex flex-col items-stretch gap-2">
        <AccountRow id={accounts[0]} label={t("bank.transfers.from")} balance={balances[accounts[0]]} locked={accounts[0] === "savings" ? locked : 0} />
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              setFrom(from === "current" ? "savings" : "current");
              setResult(null);
            }}
            aria-label={t("bank.transfers.swap")}
            className={cn("flex size-11 items-center justify-center rounded-full bg-atlas-sea text-atlas-pine", FOCUS)}
          >
            <ArrowDownUp className="size-5" aria-hidden="true" />
          </button>
        </div>
        <AccountRow id={accounts[1]} label={t("bank.transfers.to")} balance={balances[accounts[1]]} locked={accounts[1] === "savings" ? locked : 0} />
      </section>

      <section className="flex flex-col gap-3 rounded-3xl bg-white p-5 ring-1 ring-atlas-line">
        <label htmlFor={amountId} className="font-medium">
          {t("bank.transfers.amount")}
        </label>
        <input
          id={amountId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={amount}
          onChange={(e) => {
            setAmount(cleanAmountInput(e.target.value));
            setResult(null);
          }}
          className={cn("min-h-12 w-full rounded-xl border border-atlas-line bg-white px-3 text-lg tabular-nums", FOCUS)}
        />
        <div className="grid grid-cols-4 gap-2">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => {
                setAmount(String(q));
                setResult(null);
              }}
              disabled={q > available}
              className={cn("min-h-11 rounded-full border border-atlas-line text-sm font-medium tabular-nums disabled:opacity-40", FOCUS)}
            >
              {q}
            </button>
          ))}
        </div>
        <p className="text-sm text-atlas-muted">
          {t("bank.transfers.available", { amount: lei(available) })}
          {from === "savings" && locked > 0 && ` ${t("bank.transfers.lockedNote", { amount: lei(locked) })}`}
        </p>
        <button
          type="button"
          onClick={submit}
          disabled={!(value > 0)}
          className={cn("min-h-12 rounded-full bg-atlas-pine px-5 font-medium text-white disabled:opacity-40", FOCUS)}
        >
          {t(from === "current" ? "bank.transfers.toSavings" : "bank.transfers.toCurrent")}
        </button>

        {result && (
          <div role="status" className={cn("rounded-2xl px-4 py-3", result.ok ? "bg-atlas-sea" : "bg-ritm-spike-tint text-ritm-spike")}>
            {result.ok ? (
              <>
                <p className="text-sm">
                  {t(result.transfer.to === "savings" ? "bank.transfers.doneToSavings" : "bank.transfers.doneToCurrent", {
                    amount: lei(result.transfer.amount),
                  })}
                </p>
                <p className="mt-1 font-medium tabular-nums">
                  {t("bank.transfers.currentChange", { before: lei(result.before.current), after: lei(result.after.current) })}
                </p>
                <p className="font-medium tabular-nums">
                  {t("bank.transfers.savingsChange", { before: lei(result.before.savings), after: lei(result.after.savings) })}
                </p>
              </>
            ) : (
              <p className="text-sm">
                {result.reason === "notEnoughMoney"
                  ? t("bank.transfers.notEnough", { amount: lei(result.available) })
                  : t("bank.transfers.invalid")}
              </p>
            )}
          </div>
        )}
      </section>

      {transfers.length > 0 && (
        <section aria-labelledby="transfers-history">
          <h2 id="transfers-history" className="text-sm font-medium text-atlas-muted">
            {t("bank.transfers.history")}
          </h2>
          <ul className="mt-1 divide-y divide-atlas-line">
            {[...transfers].reverse().map((tr) => (
              <li key={tr.id} className="flex min-h-12 items-center justify-between gap-3 py-2">
                <span>
                  <span className="block font-medium">
                    {t(tr.to === "savings" ? "bank.transfers.rowToSavings" : "bank.transfers.rowToCurrent")}
                  </span>
                  <span className="block text-sm text-atlas-muted">{t("common.demo.day", { day: tr.day })}</span>
                </span>
                <span className="font-medium tabular-nums">{lei(tr.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function AccountRow({ id, label, balance, locked }: { id: AccountId; label: string; balance: number; locked: number }) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const Icon = id === "current" ? Wallet : PiggyBank;
  return (
    <div className="flex min-h-16 items-center gap-4 rounded-3xl bg-white px-5 py-3 ring-1 ring-atlas-line">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-atlas-sea text-atlas-pine" aria-hidden="true">
        <Icon className="size-5" />
      </span>
      <span className="flex-1">
        <span className="block text-xs text-atlas-muted">{label}</span>
        <span className="block font-medium">{t(`bank.transfers.account.${id}`)}</span>
        {locked > 0 && (
          <span className="mt-0.5 flex items-center gap-1 text-xs text-atlas-muted">
            <Lock className="size-3" aria-hidden="true" />
            {t("bank.transfers.locked", { amount: formatLei(locked, locale) })}
          </span>
        )}
      </span>
      <span className="font-medium tabular-nums">{formatLei(balance, locale)}</span>
    </div>
  );
}
