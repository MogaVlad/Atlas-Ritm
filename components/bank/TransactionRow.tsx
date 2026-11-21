"use client";

import Link from "next/link";
import { useBank } from "@/lib/store/useBank";
import type { Transaction } from "@/lib/engine";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { CategoryIcon } from "./categories";

/** "+4.800,00 lei" for money in, "−90,00 lei" for money out (engine: positive amount = money out). */
export function signedLei(amount: number, locale: "ro" | "en"): string {
  return `${amount < 0 ? "+" : "−"}${formatLei(Math.abs(amount), locale)}`;
}

export function TransactionRow({ tx }: { tx: Transaction }) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const incoming = tx.amount < 0;
  const essential = useBank((s) => s.ritm.essentialCategories.includes(tx.category));

  // A declined payment was never charged: shown so it doesn't vanish, but there's nothing to open.
  if (tx.declined) {
    return (
      <li className="-mx-2 flex min-h-16 items-center gap-3 px-2 py-2.5 opacity-70">
        <CategoryIcon category={tx.category} incoming={false} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-atlas-ink">{tx.merchant}</span>
          <span className="text-sm text-ritm-spike">{t("bank.transactions.declined")}</span>
        </span>
        <span className="shrink-0 font-medium text-atlas-muted tabular-nums line-through">{signedLei(tx.amount, locale)}</span>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={`/transactions/${tx.id}`}
        className="-mx-2 flex min-h-16 items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-atlas-sea/40 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-atlas-pine"
      >
        <CategoryIcon category={tx.category} incoming={incoming} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-atlas-ink">{tx.merchant}</span>
          <span className="flex items-center gap-2 text-sm text-atlas-muted">
            {t(`bank.categories.${tx.category}`)}
            {/* Money in that isn't the salary is a refund: say so, or it looks like money from nowhere. */}
            {incoming && tx.category !== "salary" && (
              <span className="rounded-full border border-atlas-line px-2 text-xs leading-5 text-atlas-pine">
                {t("bank.transactions.refund")}
              </span>
            )}
            {essential && (
              <span className="rounded-full border border-atlas-line px-2 text-xs leading-5 text-atlas-pine">
                {t("bank.transactions.essential")}
              </span>
            )}
            {tx.planned && (
              <span className="rounded-full border border-atlas-line px-2 text-xs leading-5 text-atlas-pine">
                {t("bank.transactions.planned")}
              </span>
            )}
          </span>
        </span>
        <span className={`shrink-0 font-medium tabular-nums ${incoming ? "text-atlas-pine" : "text-atlas-ink"}`}>
          {signedLei(tx.amount, locale)}
        </span>
      </Link>
    </li>
  );
}
