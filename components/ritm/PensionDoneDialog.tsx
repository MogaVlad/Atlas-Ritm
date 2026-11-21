"use client";

import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef } from "react";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";

/**
 * Shown right after a Pillar III contribution is confirmed (Speed bump or Lock unlock):
 * what went where and the tax benefit, then back to the screen underneath.
 */
export function PensionDoneDialog({
  result,
  onClose,
}: {
  result: { amount: number; taxSavedUpTo: number };
  onClose: () => void;
}) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const reduce = useReducedMotion();
  const titleId = useId();
  const ok = useRef<HTMLButtonElement>(null);

  useEffect(() => ok.current?.focus(), []);

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-atlas-ink/40 p-5" onClick={onClose}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        initial={reduce ? false : { opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex w-full max-w-[340px] flex-col items-center rounded-3xl bg-white p-6 text-center shadow-2xl"
      >
        <motion.span
          aria-hidden
          initial={reduce ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: reduce ? 0 : 0.15, type: "spring", stiffness: 300, damping: 18 }}
          className="flex size-16 items-center justify-center rounded-full bg-ritm text-white"
        >
          <Check className="size-8" strokeWidth={2.5} />
        </motion.span>
        <h2 id={titleId} className="mt-4 font-display text-2xl leading-tight font-semibold">
          {t("ritm.pension.donePopup.title", { amount: formatLei(result.amount, locale) })}
        </h2>
        {result.taxSavedUpTo > 0 && (
          <p className="mt-3 rounded-2xl bg-ritm-tint px-4 py-3 font-medium text-ritm">
            {t("ritm.pension.donePopup.tax", { tax: formatLei(result.taxSavedUpTo, locale) })}
          </p>
        )}
        <p className="mt-3 text-sm leading-snug text-atlas-muted">{t("ritm.pension.donePopup.note")}</p>
        <button
          ref={ok}
          type="button"
          onClick={onClose}
          className="mt-6 min-h-12 w-full rounded-full bg-ritm px-5 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm"
        >
          {t("ritm.pension.donePopup.ok")}
        </button>
      </motion.div>
    </div>
  );
}
