"use client";

import { CircleCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { AskRitmSheet } from "@/components/bank/AskRitmSheet";
import { AtlasWordmark } from "@/components/bank/AtlasMark";
import { CARD_LAST4 } from "@/components/bank/bankData";
import { FullScreen } from "@/components/bank/FullScreen";
import { MODAHUB_JACKET, usePendingPurchase } from "@/components/bank/purchases";
import { SpeedBumpSlot } from "@/components/bank/SpeedBumpSlot";
import { shouldShowSpeedBump, type Transaction } from "@/lib/engine";
import { formatLei } from "@/lib/format";
import { useFlash } from "@/lib/store/flash";
import { useLocale, useT } from "@/lib/i18n";
import { useBank } from "@/lib/store/useBank";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 py-3">
      <dt className="text-sm text-atlas-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

/**
 * Atlas's online-payment approval step (opened from the shop or the demo tools). Before Confirm,
 * the engine decides whether the Speed bump pauses this payment. A payment bigger than the
 * current balance is refused.
 */
export default function ConfirmPaymentPage() {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const router = useRouter();
  const day = useBank((s) => s.demoDay);
  const ritm = useBank((s) => s.ritm);
  const pace = useBank((s) => s.pace);
  const balance = useBank((s) => s.balances.current);
  const addTransaction = useBank((s) => s.addTransaction);
  const showFlash = useFlash((s) => s.show);
  const purchase = usePendingPurchase((s) => s.purchase);
  const [status, setStatus] = useState<"review" | "paused" | "paid">("review");
  const [askOpen, setAskOpen] = useState(false);

  // Next keeps routes you left alive (<Activity>) with their state: start fresh each time the
  // page is shown again, or a second purchase would open on "Payment approved".
  useLayoutEffect(
    () => () => {
      setStatus("review");
      setAskOpen(false);
    },
    [],
  );

  const candidate: Transaction = { id: "pending", day, ...purchase };
  const needsSpeedBump = shouldShowSpeedBump(candidate, ritm, pace);
  const affordable = purchase.amount <= balance;
  // The jacket came from the ModaHub shop; a purchase from the demo tools goes back to Payments.
  const backHref = purchase === MODAHUB_JACKET ? "/payments/checkout" : "/payments";

  function pay() {
    if (!affordable) return;
    addTransaction(purchase);
    setStatus("paid");
  }

  // Pay anyway on the Speed bump: the 3 s hold was the decision, so it pays at once and says so
  // with a short message on Home (no second confirmation). replace: Back can't reopen the payment.
  function payAfterSpeedBump() {
    if (!affordable) return;
    addTransaction(purchase);
    showFlash({ key: "common.flash.paid", values: { amount: formatLei(purchase.amount, locale), merchant: purchase.merchant } });
    router.replace("/");
  }

  function onConfirm() {
    if (!affordable) return;
    if (needsSpeedBump) setStatus("paused");
    else pay();
  }

  if (status === "paid") {
    return (
      <FullScreen className="items-center justify-center bg-atlas-paper px-8 text-center text-atlas-ink">
        <CircleCheck className="size-16 text-atlas-pine" strokeWidth={1.5} aria-hidden="true" />
        <h1 className="mt-4 font-display text-2xl font-semibold" role="status">
          {t("bank.confirm.paidTitle")}
        </h1>
        <p className="mt-2 text-atlas-muted">
          {t("bank.confirm.paidBody", { amount: formatLei(purchase.amount, locale), merchant: purchase.merchant })}
        </p>
        {/* replace: a back gesture from Home must not reopen this approval and pay twice. */}
        <Link
          href="/"
          replace
          className="mt-8 flex min-h-12 w-full items-center justify-center rounded-full bg-atlas-pine font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine"
        >
          {t("bank.confirm.backHome")}
        </Link>
      </FullScreen>
    );
  }

  return (
    <>
      <FullScreen className="bg-atlas-paper text-atlas-ink">
        <header className="flex items-center justify-between border-b border-atlas-line px-5 pt-4 pb-3">
          <AtlasWordmark />
          <span className="flex items-center gap-1.5 text-sm text-atlas-muted">
            <ShieldCheck className="size-4 text-atlas-pine" aria-hidden="true" />
            {t("bank.confirm.secure")}
          </span>
        </header>
  
        <main className="flex flex-1 flex-col px-5 pt-6 pb-8">
          <h1 className="font-display text-[1.7rem] leading-tight font-semibold tracking-[-0.02em]">{t("bank.confirm.title")}</h1>
          <p className="mt-1 text-atlas-muted">{t("bank.confirm.intro")}</p>
  
          <p className="mt-6 font-display text-[2.6rem] leading-none font-semibold tracking-[-0.03em] tabular-nums">
            {formatLei(purchase.amount, locale)}
          </p>
          {!affordable && (
            <p role="alert" className="mt-3 text-sm text-ritm-spike">
              {t("bank.confirm.insufficient", { balance: formatLei(balance, locale) })}
            </p>
          )}

          <dl className="mt-6 divide-y divide-atlas-line rounded-3xl border border-atlas-line bg-white px-5">
            <Row label={t("bank.confirm.merchant")} value={purchase.merchant} />
            <Row label={t("bank.detail.card")} value={`••• ${CARD_LAST4}`} />
            <Row label={t("bank.detail.account")} value={t("bank.home.balanceLabel")} />
          </dl>
  
          <div className="mt-auto flex flex-col gap-3 pt-8">
            <button
              type="button"
              onClick={onConfirm}
              disabled={!affordable}
              className="min-h-12 rounded-full bg-atlas-pine font-medium disabled:opacity-40 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine"
            >
              {t("bank.confirm.confirm")}
            </button>
            <button
              type="button"
              onClick={() => router.replace(backHref)}
              className="min-h-12 rounded-full border border-atlas-line font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine"
            >
              {t("bank.confirm.cancel")}
            </button>
          </div>
        </main>
      </FullScreen>

      {/* Outside the scrolling FullScreen: on short phones the page scrolls to reach Confirm, and a
          sheet inside it would scroll up with the content, leaving its bottom buttons off screen. */}
      {status === "paused" && (
        <SpeedBumpSlot
          purchase={purchase}
          pace={pace}
          onConfirm={payAfterSpeedBump}
          onNotNow={() => router.replace(backHref)}
          onBackToAtlas={() => router.replace("/")}
          onAskRitm={() => setAskOpen(true)}
        />
      )}
      {status === "paused" && askOpen && <AskRitmSheet purchase={purchase}onClose={() => setAskOpen(false)} />}
    </>
  );
}
