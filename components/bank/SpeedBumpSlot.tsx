"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { PaceState } from "@/lib/engine";
import { RULES } from "@/lib/engine";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import type { Purchase } from "./purchases";

export interface SpeedBumpSlotProps {
  purchase: Purchase;
  pace: PaceState;
  /** Pay anyway (only reachable after the confirm delay). */
  onConfirm: () => void;
  /** Don't buy now: back to the shop. */
  onNotNow: () => void;
}

/**
 * Slot for Horia's <SpeedBumpSheet/> (H4). Same props it will get; until it lands this
 * minimal sheet keeps the demo working: the purchase, safe to spend today, and Confirm
 * active after RULES.speedBump.confirmDelaySeconds. Goal impact, Move to Lock, pension
 * and Ask Ritm come with Horia's sheet.
 */
export function SpeedBumpSlot({ purchase, pace, onConfirm, onNotNow }: SpeedBumpSlotProps) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const reduce = useReducedMotion();
  const delay = RULES.speedBump.confirmDelaySeconds;
  const [left, setLeft] = useState<number>(delay);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end bg-atlas-ink/40">
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="speedbump-title"
        initial={reduce ? { opacity: 0 } : { y: "100%" }}
        animate={reduce ? { opacity: 1 } : { y: 0 }}
        transition={{ duration: reduce ? 0.1 : 0.3, ease: "easeOut" }}
        className="rounded-t-[28px] bg-atlas-paper px-6 pt-3 pb-8"
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-atlas-line" aria-hidden="true" />
        <h2 id="speedbump-title" ref={titleRef} tabIndex={-1} className="font-display text-2xl font-semibold outline-none">
          {t("bank.speedBump.title")}
        </h2>
        <p className="mt-2 leading-relaxed text-atlas-muted">
          {t("bank.speedBump.body", {
            amount: formatLei(purchase.amount, locale),
            merchant: purchase.merchant,
            safe: formatLei(pace.safeToSpendToday, locale),
          })}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onNotNow}
            className="min-h-12 rounded-full bg-atlas-pine font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine"
          >
            {t("bank.speedBump.notNow")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={left > 0}
            className="min-h-12 rounded-full border border-atlas-line font-medium text-atlas-ink tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine disabled:text-atlas-muted"
          >
            {left > 0 ? t("bank.speedBump.confirmIn", { seconds: left }) : t("bank.speedBump.confirm")}
          </button>
        </div>
      </motion.section>
    </div>
  );
}
