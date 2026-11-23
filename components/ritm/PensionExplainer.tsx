"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { pensionDeductibleLimit, pensionTaxBenefit, type PensionSource } from "@/lib/engine";
import { cleanAmountInput, formatLei, parseAmount } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { useBank } from "@/lib/store/useBank";
import { cn } from "@/lib/utils";

export type PensionExplainerProps = {
  /** Prefilled amount (the purchase not made, or the money kept at unlock). */
  amount: number;
  source: PensionSource;
  onClose: () => void;
  /** After a successful contribution. */
  onDone: (result: { amount: number; taxSavedUpTo: number }) => void;
};

const ASF_URL = "https://asfromania.ro";

type Step = "what" | "get" | "know" | "join" | "pay";
const TITLES: Record<Step, string> = {
  what: "ritm.pension.whatTitle",
  get: "ritm.pension.getTitle",
  know: "ritm.pension.catchTitle",
  join: "ritm.pension.join.title",
  pay: "ritm.pension.contributeTitle",
};
const SUMMARY = ["s1", "s2", "s3", "s4", "s5"] as const;

/**
 * Pillar III, explained before anything moves, in short steps instead of one block:
 * what it is → what you get (the tax saving in RON) → what to know (payout rules, fees) →
 * join (first time only: prospectus summary + signed adhesion act, Law 204/2006 art. 74) → the payment.
 * The amount, the checkbox and the explicit button come only on the last step. No projected returns.
 */
export function PensionExplainer({ amount: initial, source, onClose, onDone }: PensionExplainerProps) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const reduce = useReducedMotion();
  const titleId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const already = useBank((s) => s.pension.total);
  const contribute = useBank((s) => s.contributeToPension);

  // Someone who already paid in is a member; everyone else joins first (adhesion act).
  const [member] = useState(() => already > 0);
  const steps: Step[] = member ? ["what", "get", "know", "pay"] : ["what", "get", "know", "join", "pay"];
  const [step, setStep] = useState(1);
  const kind = steps[step - 1];
  const [readSummary, setReadSummary] = useState(false); // never pre-selected
  const [signed, setSigned] = useState(false);
  const [amount, setAmount] = useState(String(initial));
  const [understood, setUnderstood] = useState(false); // never pre-selected
  const [error, setError] = useState<string | null>(null);
  useEffect(() => heading.current?.focus(), [step]);

  const value = parseAmount(amount);
  const lei = (n: number) => formatLei(n, locale);
  const { taxSavedUpTo } = pensionTaxBenefit(value, already);

  const submit = () => {
    const result = contribute({ amount: value, source, consent: understood });
    if (!result.ok) return setError(t(`ritm.pension.error.${result.reason}`));
    onDone({ amount: result.contribution.amount, taxSavedUpTo: result.taxSavedUpTo });
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end bg-atlas-ink/40">
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        initial={reduce ? { opacity: 0 } : { y: "100%" }}
        animate={reduce ? { opacity: 1 } : { y: 0 }}
        transition={{ duration: reduce ? 0.1 : 0.3, ease: "easeOut" }}
        className="max-h-[94%] overflow-y-auto rounded-t-[28px] bg-white px-6 pt-3 pb-8"
      >
        <div aria-hidden className="mx-auto mb-4 h-1 w-10 rounded-full bg-atlas-line" />
        <p className="text-sm text-atlas-muted">{t("ritm.pension.title")}</p>
        <div aria-hidden className="mt-2 flex gap-1.5">
          {steps.map((_, i) => (
            <span key={i} className={cn("h-1 flex-1 rounded-full", i < step ? "bg-ritm" : "bg-ritm-track")} />
          ))}
        </div>
        <p className="mt-2 text-xs text-atlas-muted">{t("ritm.pension.step", { step, total: steps.length })}</p>
        <h2 id={titleId} ref={heading} tabIndex={-1} className="mt-1 font-display text-2xl leading-tight font-semibold outline-none">
          {t(TITLES[kind])}
        </h2>

        {kind === "what" && <p className="mt-3 leading-snug">{t("ritm.pension.what")}</p>}

        {kind === "get" && (
          <>
            <p className="mt-3 font-display text-3xl font-semibold tabular-nums">{t("ritm.pension.getBig", { tax: lei(taxSavedUpTo) })}</p>
            <p className="mt-2 leading-snug text-atlas-muted">
              {t("ritm.pension.get", { limit: lei(pensionDeductibleLimit()), amount: lei(value), tax: lei(taxSavedUpTo) })}
            </p>
          </>
        )}

        {kind === "know" && (
          <>
            <p className="mt-3 leading-snug">{t("ritm.pension.catch")}</p>
            <p className="mt-2 text-sm leading-snug text-atlas-muted">{t("ritm.pension.fees")}</p>
            <p className="mt-4 rounded-2xl bg-ritm-tint px-4 py-3 text-sm">
              {t("ritm.pension.fund")}{" "}
              <a href={ASF_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-ritm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ritm">
                {t("ritm.pension.asfLink")}
              </a>
            </p>
          </>
        )}

        {kind === "join" && (
          <>
            <p className="mt-3 leading-snug">{t("ritm.pension.join.intro")}</p>
            <section aria-labelledby="prospectus" className="mt-4 rounded-2xl border border-atlas-line px-4 py-3">
              <h3 id="prospectus" className="text-sm font-semibold">{t("ritm.pension.join.summaryTitle")}</h3>
              <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-4 text-sm leading-snug">
                {SUMMARY.map((k) => (
                  <li key={k}>{t(`ritm.pension.join.${k}`)}</li>
                ))}
              </ul>
            </section>
            <p className="mt-3 text-xs leading-snug text-atlas-muted">{t("ritm.pension.join.agent")}</p>
            {signed ? (
              <p role="status" className="mt-4 rounded-2xl bg-ritm-tint px-4 py-3 text-sm font-medium text-ritm">
                {t("ritm.pension.join.signed")}
              </p>
            ) : (
              <label className="mt-4 flex min-h-11 items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={readSummary}
                  onChange={(e) => setReadSummary(e.target.checked)}
                  className="mt-0.5 size-5 shrink-0 accent-ritm"
                />
                {t("ritm.pension.join.read")}
              </label>
            )}
          </>
        )}

        {kind === "pay" && (
          <>
            {signed && <p className="mt-3 text-sm text-ritm">{t("ritm.pension.join.signed")}</p>}

            <label className="mt-5 flex flex-col gap-1.5 text-sm font-medium">
              {t("ritm.pension.amount")}
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={amount}
                // No minus sign: a contribution is never negative.
                onChange={(e) => setAmount(cleanAmountInput(e.target.value))}
                className="min-h-11 w-full rounded-xl border border-atlas-line bg-white px-3 text-base font-normal focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ritm"
              />
            </label>

            <label className="mt-4 flex min-h-11 items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
                className="mt-0.5 size-5 shrink-0 accent-ritm"
              />
              {t("ritm.pension.consent")}
            </label>

            {error && (
              <p role="alert" className="mt-3 text-sm text-ritm-spike">
                {error}
              </p>
            )}
          </>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {kind === "join" && !signed ? (
            <button
              type="button"
              onClick={() => {
                setSigned(true);
                setStep(step + 1);
              }}
              disabled={!readSummary}
              className="min-h-12 rounded-full bg-ritm px-5 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm disabled:bg-ritm-track disabled:text-atlas-muted"
            >
              {t("ritm.pension.join.sign")}
            </button>
          ) : step < steps.length ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="min-h-12 rounded-full bg-ritm px-5 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm"
            >
              {t("ritm.pension.next")}
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!understood}
              className="min-h-12 rounded-full bg-ritm px-5 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm disabled:bg-ritm-track disabled:text-atlas-muted"
            >
              {t("ritm.pension.contribute", { amount: lei(value) })}
            </button>
          )}
          <div className="flex gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="min-h-12 flex-1 rounded-full border border-atlas-line px-5 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm"
              >
                {t("ritm.pension.back")}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="min-h-12 flex-1 rounded-full border border-atlas-line px-5 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm"
            >
              {t("ritm.pension.notNow")}
            </button>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
