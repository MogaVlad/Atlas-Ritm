"use client";

import { CircleCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AtlasWordmark } from "@/components/bank/AtlasMark";
import { CARD_LAST4 } from "@/components/bank/bankData";
import { FullScreen } from "@/components/bank/FullScreen";
import { MODAHUB_JACKET } from "@/components/bank/purchases";
import { SpeedBumpSlot } from "@/components/bank/SpeedBumpSlot";
import { shouldShowSpeedBump, type Transaction } from "@/lib/engine";
import { formatLei } from "@/lib/format";
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
 * Atlas's online-payment approval step (opened from the shop). Before Confirm, the engine
 * decides whether the Speed bump pauses this payment.
 */
export default function ConfirmPaymentPage() {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const router = useRouter();
  const day = useBank((s) => s.demoDay);
  const ritm = useBank((s) => s.ritm);
  const pace = useBank((s) => s.pace);
  const addTransaction = useBank((s) => s.addTransaction);
  const [status, setStatus] = useState<"review" | "paused" | "paid">("review");

  const candidate: Transaction = { id: "pending", day, ...MODAHUB_JACKET };
  const needsSpeedBump = shouldShowSpeedBump(candidate, ritm, pace);

  function pay() {
    addTransaction(MODAHUB_JACKET);
    setStatus("paid");
  }

  function onConfirm() {
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
          {t("bank.confirm.paidBody", { amount: formatLei(MODAHUB_JACKET.amount, locale), merchant: MODAHUB_JACKET.merchant })}
        </p>
        <Link
          href="/"
          className="mt-8 flex min-h-12 w-full items-center justify-center rounded-full bg-atlas-pine font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine"
        >
          {t("bank.confirm.backHome")}
        </Link>
      </FullScreen>
    );
  }

  return (
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
          {formatLei(MODAHUB_JACKET.amount, locale)}
        </p>

        <dl className="mt-6 divide-y divide-atlas-line rounded-3xl border border-atlas-line bg-white px-5">
          <Row label={t("bank.confirm.merchant")} value={MODAHUB_JACKET.merchant} />
          <Row label={t("bank.detail.card")} value={`••• ${CARD_LAST4}`} />
          <Row label={t("bank.detail.account")} value={t("bank.home.balanceLabel")} />
        </dl>

        <div className="mt-auto flex flex-col gap-3 pt-8">
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-12 rounded-full bg-atlas-pine font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine"
          >
            {t("bank.confirm.confirm")}
          </button>
          <button
            type="button"
            onClick={() => router.push("/payments/checkout")}
            className="min-h-12 rounded-full border border-atlas-line font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine"
          >
            {t("bank.confirm.cancel")}
          </button>
        </div>
      </main>

      {status === "paused" && (
        <SpeedBumpSlot
          purchase={MODAHUB_JACKET}
          pace={pace}
          onConfirm={pay}
          onNotNow={() => router.push("/payments/checkout")}
        />
      )}
    </FullScreen>
  );
}
