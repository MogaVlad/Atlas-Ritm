"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { RULES, type PaceState } from "@/lib/engine";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { useBank } from "@/lib/store/useBank";
import { PensionExplainer } from "./PensionExplainer";

export interface SpeedBumpSheetProps {
  purchase: { merchant: string; amount: number };
  pace: PaceState;
  /** Pay anyway (only reachable after the confirm delay). */
  onConfirm: () => void;
  /** Don't buy now: back to the shop. */
  onNotNow: () => void;
  /** Opens Ask Ritm (I4). Hidden until passed. */
  onAskRitm?: () => void;
}

/** The pause before a big online payment: the purchase in month and goal terms, then the user's choice. */
export function SpeedBumpSheet({ purchase, pace, onConfirm, onNotNow, onAskRitm }: SpeedBumpSheetProps) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const reduce = useReducedMotion();
  const titleId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const delay = RULES.speedBump.confirmDelaySeconds;
  const [left, setLeft] = useState<number>(delay);
  const [locked, setLocked] = useState(false);
  const [pensionOpen, setPensionOpen] = useState(false);
  const [pensioned, setPensioned] = useState<{ amount: number; taxSavedUpTo: number } | null>(null);

  const goal = useBank((s) => s.ritm.goal);
  const monthlySaving = useBank((s) => s.ritm.lock.amount);
  const unlockDay = useBank((s) => s.lock?.unlockDay ?? s.ritm.lock.unlockDay);
  const lockMoney = useBank((s) => s.lockMoney);

  useEffect(() => {
    heading.current?.focus();
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  // Next keeps hidden routes alive (<Activity>): start fresh every time the sheet is shown again.
  useLayoutEffect(
    () => () => {
      setLeft(delay);
      setLocked(false);
      setPensionOpen(false);
      setPensioned(null);
    },
    [delay],
  );

  const amount = formatLei(purchase.amount, locale);
  // shortcut: goal impact computed here (days of saving at the monthly Lock amount); move to lib/engine as goalImpactDays when Cosma has time.
  const goalDays = monthlySaving > 0 ? Math.ceil(purchase.amount / (monthlySaving / RULES.cycleLength)) : null;

  const moveToLock = () => {
    lockMoney(purchase.amount);
    setLocked(true);
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end bg-atlas-ink/40">
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={(e) => e.key === "Escape" && !pensionOpen && onNotNow()}
        initial={reduce ? { opacity: 0 } : { y: "100%" }}
        animate={reduce ? { opacity: 1 } : { y: 0 }}
        transition={{ duration: reduce ? 0.1 : 0.3, ease: "easeOut" }}
        className="max-h-[92%] overflow-y-auto rounded-t-[28px] bg-white px-6 pt-3 pb-8"
      >
        <div aria-hidden className="mx-auto mb-4 h-1 w-10 rounded-full bg-atlas-line" />
        <p className="inline-block rounded-full bg-ritm-tint px-3 py-1 text-sm font-medium text-ritm">
          {t("ritm.speedBump.tag", { day: pace.dayOfCycle })}
        </p>
        <h2 id={titleId} ref={heading} tabIndex={-1} className="mt-3 font-display text-2xl leading-tight font-semibold outline-none">
          {t("ritm.speedBump.title")}
        </h2>

        <div className="mt-5 flex items-baseline justify-between gap-4 border-b border-atlas-line pb-4">
          <span className="text-lg">{purchase.merchant}</span>
          <span className="font-display text-3xl font-semibold tabular-nums">{amount}</span>
        </div>

        <ul className="mt-4 flex flex-col gap-2.5 leading-snug">
          <li>
            {t("ritm.speedBump.progress", {
              day: pace.dayOfCycle,
              total: pace.cycleLength,
              pct: Math.round(pace.pctSpent * 100),
            })}
          </li>
          {goalDays !== null && <li>{t("ritm.speedBump.goal", { days: goalDays, goal: goal.name })}</li>}
          <li>{t("ritm.speedBump.safe", { amount: formatLei(pace.safeToSpendToday, locale) })}</li>
        </ul>

        {locked || pensioned ? (
          <div className="mt-6 flex flex-col gap-3">
            <p role="status" className="rounded-2xl bg-ritm-tint px-4 py-3 font-medium text-ritm">
              {pensioned
                ? t("ritm.pension.done", { amount: formatLei(pensioned.amount, locale), tax: formatLei(pensioned.taxSavedUpTo, locale) })
                : t("ritm.speedBump.lockedDone", { amount, day: unlockDay })}
            </p>
            <button type="button" onClick={onNotNow} className={PRIMARY}>
              {t("ritm.speedBump.backToShop")}
            </button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            <p className="text-sm text-atlas-muted">{t("ritm.speedBump.choice")}</p>
            <button type="button" onClick={onNotNow} className={PRIMARY}>
              {t("ritm.speedBump.notNow")}
            </button>
            <Option label={t("ritm.speedBump.moveToLock", { amount })} hint={t("ritm.speedBump.moveToLockHint", { day: unlockDay })} onClick={moveToLock} />
            <Option label={t("ritm.speedBump.pension")} hint={t("ritm.speedBump.pensionHint")} onClick={() => setPensionOpen(true)} />
            <button
              type="button"
              onClick={onConfirm}
              disabled={left > 0}
              className="flex min-h-12 items-center justify-center gap-2.5 rounded-full border border-atlas-line font-medium tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm disabled:text-atlas-muted"
            >
              {!reduce && left > 0 && <CountdownRing seconds={delay} />}
              {left > 0 ? t("ritm.speedBump.confirmIn", { seconds: left }) : t("ritm.speedBump.confirm")}
            </button>
            {onAskRitm && (
              <button
                type="button"
                onClick={onAskRitm}
                className="min-h-11 self-center rounded-full px-3 font-medium text-ritm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ritm"
              >
                {t("ritm.speedBump.askRitm")}
              </button>
            )}
          </div>
        )}
      </motion.section>
      {pensionOpen && (
        <PensionExplainer
          amount={purchase.amount}
          source="currentAccount"
          onClose={() => setPensionOpen(false)}
          onDone={(result) => {
            setPensionOpen(false);
            setPensioned(result);
          }}
        />
      )}
    </div>
  );
}

const PRIMARY =
  "min-h-12 rounded-full bg-ritm px-5 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm";

function Option({ label, hint, onClick }: { label: string; hint: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 flex-col items-start gap-0.5 rounded-2xl px-4 py-3 text-left ring-1 ring-atlas-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm"
    >
      <span className="font-medium text-ritm">{label}</span>
      <span className="text-sm text-atlas-muted">{hint}</span>
    </button>
  );
}

/** Fills once over the confirm delay; the seconds in the label say the same thing in words. */
function CountdownRing({ seconds }: { seconds: number }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5 -rotate-90" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" strokeWidth="3" className="stroke-ritm-track" />
      <motion.circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        className="stroke-ritm"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: seconds, ease: "linear" }}
      />
    </svg>
  );
}
