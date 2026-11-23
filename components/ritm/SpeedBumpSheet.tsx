"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { CircleCheck, Gauge, Target } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { goalImpactDays, goalMonthly, interestEstimate, pensionTaxBenefit, RULES, type PaceState } from "@/lib/engine";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { useBank } from "@/lib/store/useBank";
import { PensionDoneDialog } from "./PensionDoneDialog";
import { PensionExplainer } from "./PensionExplainer";

export interface SpeedBumpSheetProps {
  purchase: { merchant: string; amount: number };
  pace: PaceState;
  /** Pay anyway (only after holding the button for RULES.speedBump.holdSeconds). */
  onConfirm: () => void;
  /** Leave the money where it is: back to the shop. */
  onNotNow: () => void;
  /** After the money went to the Lock or the pension instead: back into the bank. */
  onBackToAtlas: () => void;
  /** Opens Ask Ritm (I4). Hidden until passed. */
  onAskRitm?: () => void;
  /** False when the purchase didn't come from a shop page (demo tools): no "Back to the shop". */
  fromShop?: boolean;
}

/**
 * The pause before a big online payment, full screen (the payment big on the ink header):
 * 1. the payment and what it means for the main goal; "Not now", or hold (RULES.speedBump.holdSeconds) to pay anyway;
 * 2. after "Not now", on the same screen: the money kept can go to the Lock, to Pillar III
 *    (explained first), or stay in the account.
 */
export function SpeedBumpSheet({ purchase, pace, onConfirm, onNotNow, onBackToAtlas, onAskRitm, fromShop = true }: SpeedBumpSheetProps) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const reduce = useReducedMotion();
  const titleId = useId();
  const hintId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const keptHeading = useRef<HTMLParagraphElement>(null);
  /** "pay": the payment step; "kept": after "Not now", what to do with the money. */
  const [step, setStep] = useState<"pay" | "kept">("pay");
  const [locked, setLocked] = useState(false);
  const [pensionOpen, setPensionOpen] = useState(false);
  const [pensioned, setPensioned] = useState<{ amount: number; taxSavedUpTo: number } | null>(null);
  /** The "Done" popup right after the pension contribution is confirmed. */
  const [doneOpen, setDoneOpen] = useState(false);

  // The main goal (the first one).
  const goal = useBank((s) => s.ritm.goals[0]);
  const lockAmount = useBank((s) => s.ritm.lock.amount);
  const unlockDay = useBank((s) => s.lock?.unlockDay ?? s.ritm.lock.unlockDay);
  const lockMoney = useBank((s) => s.lockMoney);
  const pensionSoFar = useBank((s) => s.pension.total);

  useEffect(() => heading.current?.focus(), []);
  useEffect(() => {
    if (step === "kept") keptHeading.current?.focus();
  }, [step]);
  // Next keeps hidden routes alive (<Activity>): start fresh every time the sheet is shown again.
  useLayoutEffect(
    () => () => {
      setStep("pay");
      setLocked(false);
      setPensionOpen(false);
      setPensioned(null);
      setDoneOpen(false);
    },
    [],
  );

  const amount = formatLei(purchase.amount, locale);
  // What goes aside a month for the goal: the Lock, or (without one) what the goal needs a month.
  const monthlySaving = lockAmount > 0 ? lockAmount : goal ? goalMonthly(goal) : 0;
  const goalDays = goal ? goalImpactDays(purchase.amount, monthlySaving, pace.cycleLength) : null;
  // One number per option: what each choice gives, in RON.
  const lockDays = Math.max(1, unlockDay - pace.dayOfCycle);
  const lockInterest = interestEstimate(purchase.amount, lockDays, RULES.savings.annualRate);
  const taxBack = pensionTaxBenefit(purchase.amount, pensionSoFar).taxSavedUpTo;

  const moveToLock = () => {
    lockMoney(purchase.amount);
    setLocked(true);
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-atlas-paper">
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={(e) => e.key === "Escape" && !pensionOpen && onNotNow()}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 32 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0.1 : 0.35, ease: "easeOut" }}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain [scrollbar-width:none]"
      >
        {/* The payment, big, on the ink header (the same look as Home). */}
        <header className="rounded-b-[32px] bg-atlas-ink px-6 pt-16 pb-16 text-white">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-sm font-medium">
            <Gauge className="size-4 text-atlas-brass" aria-hidden />
            {t("ritm.speedBump.tag")}
          </p>
          <h2 id={titleId} ref={heading} tabIndex={-1} className="mt-5 font-display text-[1.75rem] leading-tight font-semibold outline-none">
            {t("ritm.speedBump.title")}
          </h2>
          <p className="mt-8 text-white/70">{purchase.merchant}</p>
          <p className="mt-1 font-display text-[2.75rem] leading-none font-semibold tracking-[-0.02em] tabular-nums">{amount}</p>
        </header>

        <div className="relative -mt-9 flex flex-1 flex-col px-5 pb-8">
          {step === "pay" ? (
            <>
              {goalDays !== null && goal && (
                <div className={CARD}>
                  <span aria-hidden className={ICON}>
                    <Target className="size-6" />
                  </span>
                  <p className="leading-snug font-medium">{t("ritm.speedBump.goal", { days: goalDays, goal: goal.name })}</p>
                </div>
              )}
              <div className="mt-auto flex flex-col gap-3 pt-8">
                <p className="mb-1 text-center text-atlas-muted">{t("ritm.speedBump.choice")}</p>
                <button type="button" onClick={() => setStep("kept")} className={PRIMARY}>
                  {t("ritm.speedBump.notNow")}
                </button>
                <HoldToPay label={t("ritm.speedBump.confirm")} hintId={hintId} reduce={!!reduce} onDone={onConfirm} />
                <p id={hintId} className="-mt-1 text-center text-sm text-atlas-muted">
                  {t("ritm.speedBump.holdHint", { seconds: RULES.speedBump.holdSeconds })}
                </p>
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
            </>
          ) : locked || pensioned ? (
            <div className="flex flex-1 flex-col">
              <div className={CARD}>
                <span aria-hidden className={ICON}>
                  <CircleCheck className="size-6" />
                </span>
                <p role="status" className="leading-snug font-medium">
                  {pensioned
                    ? t("ritm.pension.done", { amount: formatLei(pensioned.amount, locale), tax: formatLei(pensioned.taxSavedUpTo, locale) })
                    : t("ritm.speedBump.lockedDone", { amount, day: unlockDay })}
                </p>
              </div>
              {/* Back into Atlas first: the shop would only lead back to this same payment. */}
              <div className="mt-auto flex flex-col gap-3 pt-8">
                <button type="button" onClick={onBackToAtlas} className={PRIMARY}>
                  {t("ritm.speedBump.backToAtlas")}
                </button>
                {fromShop && (
                  <button type="button" onClick={onNotNow} className={SECONDARY}>
                    {t("ritm.speedBump.backToShop")}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col">
              <div className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-[0_18px_40px_rgb(10_22_40/0.12)]">
                <p ref={keptHeading} tabIndex={-1} className="font-display text-lg leading-snug font-semibold outline-none">
                  {t("ritm.speedBump.keptTitle", { amount })}
                </p>
                <Option
                  label={t("ritm.speedBump.moveToLock", { amount })}
                  hint={t("ritm.speedBump.moveToLockNumber", { interest: formatLei(lockInterest, locale), day: unlockDay })}
                  onClick={moveToLock}
                />
                <Option
                  label={t("ritm.speedBump.pension")}
                  hint={t("ritm.speedBump.pensionNumber", { tax: formatLei(taxBack, locale) })}
                  onClick={() => setPensionOpen(true)}
                />
              </div>
              {/* The purchase is off and the money stays in the account: back into Atlas, not the shop or Payments. */}
              <div className="mt-auto flex flex-col pt-8">
                <button type="button" onClick={onBackToAtlas} className={SECONDARY}>
                  {t("ritm.speedBump.leaveIt")}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.section>
      {pensionOpen && (
        <PensionExplainer
          amount={purchase.amount}
          source="currentAccount"
          onClose={() => setPensionOpen(false)}
          onDone={(result) => {
            setPensionOpen(false);
            setPensioned(result);
            setDoneOpen(true);
          }}
        />
      )}
      {doneOpen && pensioned && <PensionDoneDialog result={pensioned} onClose={() => setDoneOpen(false)} />}
    </div>
  );
}

const PRIMARY =
  "min-h-12 rounded-full bg-ritm px-5 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm";
const CARD = "flex items-center gap-4 rounded-3xl bg-white p-5 shadow-[0_18px_40px_rgb(10_22_40/0.12)]";
const ICON = "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-ritm-tint text-ritm";
const SECONDARY =
  "min-h-12 rounded-full border border-atlas-line bg-white px-5 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm";

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

const WORD = "Ritm";

/**
 * Pay anyway = hold for RULES.speedBump.holdSeconds (pointer, or Space/Enter held down). A purple fill crosses
 * the box while "Ritm" is written in it letter by letter (purple on white, white on the fill); letting go early
 * rewinds it. Reduced motion: the letters fade in without moving.
 */
function HoldToPay({ label, hintId, reduce, onDone }: { label: string; hintId: string; reduce: boolean; onDone: () => void }) {
  const progress = useMotionValue(0);
  const clipPath = useTransform(progress, (p) => `inset(0 ${100 - p * 100}% 0 0)`);
  const [holding, setHolding] = useState(false);
  const run = useRef<ReturnType<typeof animate> | null>(null);

  const start = () => {
    if (run.current) return;
    setHolding(true);
    run.current = animate(progress, 1, { duration: RULES.speedBump.holdSeconds * (1 - progress.get()), ease: "linear" });
    run.current.then(() => {
      if (progress.get() >= 1) setTimeout(onDone, 250); // a beat to see the whole word
    });
  };
  const stop = () => {
    if (!run.current || progress.get() >= 1) return;
    run.current.stop();
    run.current = null;
    setHolding(false);
    animate(progress, 0, { duration: reduce ? 0 : 0.3, ease: "easeOut" });
  };
  useEffect(() => () => run.current?.stop(), []);

  return (
    <button
      type="button"
      aria-describedby={hintId}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        start();
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault();
          start();
        }
      }}
      onKeyUp={(e) => (e.key === " " || e.key === "Enter") && stop()}
      onBlur={stop}
      onContextMenu={(e) => e.preventDefault()}
      className="relative flex min-h-12 touch-none items-center active:opacity-100 justify-center overflow-hidden rounded-full border border-atlas-line bg-white font-medium select-none [-webkit-touch-callout:none] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm"
    >
      <span className={holding ? "opacity-0" : undefined}>{label}</span>
      {holding && <Word progress={progress} reduce={reduce} className="text-ritm" />}
      <motion.span aria-hidden className="absolute inset-0 bg-ritm" style={{ clipPath }}>
        {holding && <Word progress={progress} reduce={reduce} className="text-white" />}
      </motion.span>
    </button>
  );
}

/** "Ritm", each letter appearing during its quarter of the hold. */
function Word({ progress, reduce, className }: { progress: MotionValue<number>; reduce: boolean; className: string }) {
  return (
    <span aria-hidden className={`absolute inset-0 flex items-center justify-center font-display text-xl font-semibold tracking-wide ${className}`}>
      {[...WORD].map((letter, i) => (
        <Letter key={i} letter={letter} index={i} progress={progress} reduce={reduce} />
      ))}
    </span>
  );
}

function Letter({ letter, index, progress, reduce }: { letter: string; index: number; progress: MotionValue<number>; reduce: boolean }) {
  const from = index / WORD.length;
  const to = (index + 0.8) / WORD.length;
  const opacity = useTransform(progress, [from, to], [0, 1]);
  const y = useTransform(progress, [from, to], reduce ? [0, 0] : [12, 0]);
  const scale = useTransform(progress, [from, to], reduce ? [1, 1] : [0.5, 1]);
  return <motion.span style={{ opacity, y, scale, display: "inline-block" }}>{letter}</motion.span>;
}
