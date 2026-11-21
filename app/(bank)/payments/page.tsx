"use client";

import { ChevronRight, Globe, Nfc } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { CAFE_TAP, MODAHUB_JACKET } from "@/components/bank/purchases";
import { Toast } from "@/components/bank/Toast";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { useBank } from "@/lib/store/useBank";

const ROW =
  "flex min-h-18 w-full items-center gap-4 rounded-3xl border border-atlas-line bg-white px-5 py-4 text-left transition-colors hover:border-atlas-pine/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine";

export default function PaymentsPage() {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const addTransaction = useBank((s) => s.addTransaction);
  const [toast, setToast] = useState<string | null>(null);
  const closeToast = useCallback(() => setToast(null), []);

  function tapInStore() {
    addTransaction(CAFE_TAP);
    // The store recomputes the pace synchronously, so this is the number after the tap.
    const { pace, ritm } = useBank.getState();
    const values = { amount: formatLei(CAFE_TAP.amount, locale), merchant: CAFE_TAP.merchant };
    setToast(
      ritm.enabled
        ? t("bank.payments.tapToast", { ...values, safe: formatLei(pace.safeToSpendToday, locale) })
        : t("bank.payments.tapToastNoRitm", values),
    );
  }

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

        <button type="button" onClick={tapInStore} className={ROW}>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-atlas-sea text-atlas-pine" aria-hidden="true">
            <Nfc className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block font-medium">{t("bank.payments.tap")}</span>
            <span className="block text-sm text-atlas-muted">
              {t("bank.payments.tapHint", { merchant: CAFE_TAP.merchant, amount: formatLei(CAFE_TAP.amount, locale) })}
            </span>
          </span>
        </button>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-atlas-muted">{t("bank.payments.simulatedNote")}</p>

      <Toast open={toast !== null} onClose={closeToast}>
        {toast}
      </Toast>
    </div>
  );
}
