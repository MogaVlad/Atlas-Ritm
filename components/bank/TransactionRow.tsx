"use client";

import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { CATEGORY_ICON, ESSENTIAL_CATEGORIES } from "./categories";
import type { MockTransaction } from "./mockData";

export function TransactionRow({ tx }: { tx: MockTransaction }) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const Icon = CATEGORY_ICON[tx.category];
  const incoming = tx.amount > 0;
  const essential = ESSENTIAL_CATEGORIES.has(tx.category);

  return (
    <li className="flex min-h-16 items-center gap-3 py-2.5">
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
          incoming ? "bg-atlas-pine text-white" : "bg-atlas-sea text-atlas-pine"
        }`}
        aria-hidden="true"
      >
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-atlas-ink">{tx.merchant}</p>
        <p className="flex items-center gap-2 text-sm text-atlas-muted">
          {t(`bank.categories.${tx.category}`)}
          {essential && (
            <span className="rounded-full border border-atlas-line px-2 text-xs leading-5 text-atlas-pine">
              {t("bank.transactions.essential")}
            </span>
          )}
        </p>
      </div>
      <p className={`shrink-0 font-medium tabular-nums ${incoming ? "text-atlas-pine" : "text-atlas-ink"}`}>
        {incoming ? "+" : "−"}
        {formatLei(Math.abs(tx.amount), locale)}
      </p>
    </li>
  );
}
