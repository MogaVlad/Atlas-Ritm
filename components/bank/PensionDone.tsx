"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";

/** How long the success screen stays before going Home. Short; "Stay here" is there to read it calmly. */
const SECONDS = 3;
const R = 52;
const CIRCUMFERENCE = 2 * Math.PI * R;

/**
 * After money goes to Pillar III: a calm confirmation over the whole phone, a ring that empties
 * over SECONDS, then Home. "Stay here" stops the timer (nobody is moved on before they've read it).
 * Not a decision countdown: the money has already moved, nothing is being rushed.
 */
export function PensionDone({
  amount,
  taxSavedUpTo,
  onStay,
}: {
  amount: number;
  taxSavedUpTo: number;
  /** Cancel the redirect and go back to the screen underneath. */
  onStay: () => void;
}) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const reduce = useReducedMotion();
  const router = useRouter();
  const titleId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const [left, setLeft] = useState(SECONDS);

  useEffect(() => {
    heading.current?.focus();
    const tick = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (left === 0) router.replace("/");
  }, [left, router]);

  const lei = (n: number) => formatLei(n, locale);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={(e) => e.key === "Escape" && onStay()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0.1 : 0.35, ease: "easeOut" }}
      className="absolute inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-ritm px-8 text-center text-white"
    >
      {/* Soft rings behind, like the ripples of the Atlas contours. Decoration only. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {[340, 480, 620].map((size) => (
          <span key={size} className="absolute rounded-full border border-white/10" style={{ width: size, height: size }} />
        ))}
      </div>

      {/* The timer: the ring empties over SECONDS, the check draws itself once. */}
      <div className="relative size-36" aria-hidden="true">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90">
          <circle cx="60" cy="60" r={R} fill="none" strokeWidth="6" className="stroke-white/20" />
          <motion.circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className="stroke-white"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: reduce ? 0 : CIRCUMFERENCE }}
            transition={{ duration: SECONDS, ease: "linear" }}
          />
        </svg>
        <svg viewBox="0 0 48 48" className="absolute inset-0 m-auto size-14">
          <motion.path
            d="M12 25 L21 34 L37 15"
            fill="none"
            stroke="white"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: reduce ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          />
        </svg>
      </div>

      <h2 id={titleId} ref={heading} tabIndex={-1} className="relative mt-8 font-display text-[1.7rem] leading-tight font-semibold text-balance outline-none">
        {t("bank.pensionDone.title", { amount: lei(amount) })}
      </h2>
      <p role="status" className="relative mt-3 max-w-72 leading-relaxed text-balance text-white/85">
        {t("bank.pensionDone.body", { tax: lei(taxSavedUpTo) })}
      </p>

      <p className="relative mt-8 text-sm text-white/75 tabular-nums">{t("bank.pensionDone.redirect", { seconds: left })}</p>

      <div className="relative mt-4 flex w-full max-w-72 flex-col gap-2">
        <button
          type="button"
          onClick={() => router.replace("/")}
          className="min-h-12 rounded-full bg-white px-5 font-medium text-ritm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {t("bank.pensionDone.goNow")}
        </button>
        <button
          type="button"
          onClick={onStay}
          className="min-h-12 rounded-full border border-white/40 px-5 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {t("bank.pensionDone.stay")}
        </button>
      </div>
    </motion.div>
  );
}
