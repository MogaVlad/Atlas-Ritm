"use client";

import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { FullScreen } from "@/components/bank/FullScreen";
import { MODAHUB_JACKET } from "@/components/bank/purchases";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";

/** A simple jacket drawing for the fictional shop. */
function JacketArt() {
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full" aria-hidden="true">
      <rect width="200" height="160" fill="#efe9e4" />
      <path
        d="M78 28 100 38l22-10 30 14 14 62-20 6-6-34v74H60V76l-6 34-20-6 14-62Z"
        fill="#2b2b33"
      />
      <path d="M100 38v108" stroke="#55555f" strokeWidth="2" />
      <path d="M86 30l14 22 14-22" fill="none" stroke="#55555f" strokeWidth="2" />
      <circle cx="106" cy="70" r="2" fill="#8a8a95" />
      <circle cx="106" cy="92" r="2" fill="#8a8a95" />
      <circle cx="106" cy="114" r="2" fill="#8a8a95" />
    </svg>
  );
}

/**
 * The fictional ModaHub shop, as seen in a browser: its own look, not Atlas's.
 * "Pay with Atlas" hands over to Atlas's payment approval screen.
 */
export default function CheckoutPage() {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const price = formatLei(MODAHUB_JACKET.amount, locale);

  return (
    <FullScreen className="bg-white text-neutral-900">
      <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-100 px-3 pt-3 pb-2">
        <Link
          href="/payments"
          aria-label={t("bank.checkout.back")}
          className="flex size-11 items-center justify-center rounded-full hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-neutral-900"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        <div className="flex flex-1 items-center gap-1.5 rounded-full bg-white px-3 py-2 text-sm text-neutral-600">
          <Lock className="size-3.5" aria-hidden="true" />
          {t("bank.checkout.address")}
        </div>
      </div>

      <header className="px-5 pt-5">
        <p className="text-xl font-black tracking-tight">
          moda<span className="font-light">hub</span>
        </p>
      </header>

      <main className="flex flex-1 flex-col px-5 pt-4 pb-8">
        <h1 className="text-sm text-neutral-500">{t("bank.checkout.cart")}</h1>
        <div className="mt-3 flex gap-4">
          <div className="size-28 shrink-0 overflow-hidden rounded-xl">
            <JacketArt />
          </div>
          <div className="flex flex-col justify-center">
            <p className="font-semibold">{t("bank.checkout.item")}</p>
            <p className="text-sm text-neutral-500">{t("bank.checkout.itemDetail")}</p>
            <p className="mt-2 font-semibold tabular-nums">{price}</p>
          </div>
        </div>

        <dl className="mt-6 space-y-2 border-t border-neutral-200 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-500">{t("bank.checkout.shipping")}</dt>
            <dd>{t("bank.checkout.free")}</dd>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <dt>{t("bank.checkout.total")}</dt>
            <dd className="tabular-nums">{price}</dd>
          </div>
        </dl>

        <Link
          href="/payments/confirm"
          className="mt-auto flex min-h-13 items-center justify-center rounded-xl bg-neutral-900 font-semibold text-white hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        >
          {t("bank.checkout.payWithAtlas")}
        </Link>
      </main>
    </FullScreen>
  );
}
