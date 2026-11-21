"use client";

import { ChevronRight, Globe, Nfc, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { CategoryIcon } from "@/components/bank/categories";
import { MODAHUB_JACKET } from "@/components/bank/purchases";
import { IN_STORE_PAYMENTS, type DemoPurchase } from "@/lib/data/inStorePayments";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { useBank, type InStoreResult } from "@/lib/store/useBank";

const ROW =
  "flex min-h-18 w-full items-center gap-4 rounded-3xl border border-atlas-line bg-white px-5 py-4 text-left transition-colors hover:border-atlas-pine/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine";

const MIN = Math.min(...IN_STORE_PAYMENTS.map((p) => p.amount));
const MAX = Math.max(...IN_STORE_PAYMENTS.map((p) => p.amount));

export default function PaymentsPage() {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="font-display text-[1.7rem] leading-tight font-semibold tracking-[-0.02em]">{t("bank.payments.title")}</h1>
      <p className="mt-1 text-atlas-muted">{t("bank.payments.intro")}</p>

      <div className="mt-6 flex flex-col gap-3">
        <Link href="/payments/checkout" className={ROW}>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-atlas-sea text-atlas-pine" aria-hidden="true">
            <Globe className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block font-medium">{t("bank.payments.online")}</span>
            <span className="block text-sm text-atlas-muted">
              {t("bank.payments.onlineHint", { merchant: MODAHUB_JACKET.merchant, amount: formatLei(MODAHUB_JACKET.amount, locale) })}
            </span>
          </span>
          <ChevronRight className="size-5 text-atlas-muted" aria-hidden="true" />
        </Link>

        <button type="button" onClick={() => setSheetOpen(true)} aria-haspopup="dialog" className={ROW}>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-atlas-sea text-atlas-pine" aria-hidden="true">
            <Nfc className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block font-medium">{t("bank.payments.tap")}</span>
            <span className="block text-sm text-atlas-muted">
              {t("bank.payments.tapHintMany", { count: IN_STORE_PAYMENTS.length, min: formatLei(MIN, locale), max: formatLei(MAX, locale) })}
            </span>
          </span>
          <ChevronRight className="size-5 text-atlas-muted" aria-hidden="true" />
        </button>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-atlas-muted">{t("bank.payments.simulatedNote")}</p>

      {sheetOpen && <InStoreSheet onClose={() => setSheetOpen(false)} />}
    </div>
  );
}

/** Pick an in-store payment; after each one the sheet shows the balance before → after. */
function InStoreSheet({ onClose }: { onClose: () => void }) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const titleId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const balance = useBank((s) => s.balances.current);
  const payInStore = useBank((s) => s.payInStore);
  const [last, setLast] = useState<InStoreResult | null>(null);

  useEffect(() => heading.current?.focus(), []);

  const pay = (p: DemoPurchase) => setLast(payInStore(p));
  const lei = (n: number) => formatLei(n, locale);

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end bg-atlas-ink/40 motion-safe:animate-in motion-safe:fade-in" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        className="max-h-[88%] overflow-y-auto rounded-t-3xl bg-white px-5 pt-3 pb-6 shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-bottom-10 motion-safe:duration-300"
      >
        <div aria-hidden className="mx-auto mb-3 h-1 w-10 rounded-full bg-atlas-line" />
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} ref={heading} tabIndex={-1} className="font-display text-2xl leading-tight font-semibold outline-none">
            {t("bank.payments.sheet.title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("bank.payments.sheet.close")}
            className="-mt-1 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-atlas-muted focus-visible:outline-2 focus-visible:outline-atlas-pine"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div role="status" aria-live="polite" className="mt-3 rounded-2xl bg-atlas-sea px-4 py-3">
          {last ? (
            <>
              <p className="text-sm">{t("bank.payments.sheet.paid", { amount: lei(last.tx.amount), merchant: last.tx.merchant })}</p>
              <p className="mt-1 font-display text-xl font-semibold tabular-nums">
                {t("bank.payments.sheet.balanceChange", { before: lei(last.balanceBefore), after: lei(last.balanceAfter) })}
              </p>
              {last.safeToSpendToday !== null && (
                <p className="mt-1 text-sm text-atlas-muted">{t("bank.payments.sheet.safe", { safe: lei(last.safeToSpendToday) })}</p>
              )}
            </>
          ) : (
            <p className="text-sm">
              {t("bank.payments.sheet.balance")} <span className="font-semibold tabular-nums">{lei(balance)}</span>
            </p>
          )}
        </div>

        <ul className="mt-4 flex flex-col gap-2">
          {IN_STORE_PAYMENTS.map((p) => (
            <li key={`${p.merchant}-${p.amount}`}>
              <button
                type="button"
                onClick={() => pay(p)}
                className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-atlas-line px-3 py-2 text-left hover:border-atlas-pine/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine"
              >
                <CategoryIcon category={p.category} />
                <span className="flex-1 font-medium">{p.merchant}</span>
                <span className="font-medium tabular-nums">{lei(p.amount)}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-atlas-muted">{t("bank.payments.sheet.hint")}</p>
      </div>
    </div>
  );
}
