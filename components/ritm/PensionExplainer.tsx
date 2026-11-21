"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { pensionDeductibleLimit, pensionTaxBenefit, type PensionSource } from "@/lib/engine";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { useBank } from "@/lib/store/useBank";

export type PensionExplainerProps = {
  /** Prefilled amount (the purchase not made, or the money kept at unlock). */
  amount: number;
  source: PensionSource;
  onClose: () => void;
  /** After a successful contribution. */
  onDone: (result: { amount: number; taxSavedUpTo: number }) => void;
};

const ASF_URL = "https://asfromania.ro";

/** Pillar III, explained before anything moves: what it is, what you get, the catch. Checkbox + explicit button. */
export function PensionExplainer({ amount: initial, source, onClose, onDone }: PensionExplainerProps) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const reduce = useReducedMotion();
  const titleId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const already = useBank((s) => s.pension.total);
  const contribute = useBank((s) => s.contributeToPension);

  const [amount, setAmount] = useState(String(initial));
  const [understood, setUnderstood] = useState(false); // never pre-selected
  const [error, setError] = useState<string | null>(null);
  useEffect(() => heading.current?.focus(), []);

  const value = Number(amount) || 0;
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
        <h2 id={titleId} ref={heading} tabIndex={-1} className="font-display text-2xl leading-tight font-semibold outline-none">
          {t("ritm.pension.title")}
        </h2>

        <dl className="mt-5 flex flex-col gap-4 leading-snug">
          <div>
            <dt className="font-medium">{t("ritm.pension.whatTitle")}</dt>
            <dd className="mt-0.5 text-atlas-muted">{t("ritm.pension.what")}</dd>
          </div>
          <div>
            <dt className="font-medium">{t("ritm.pension.getTitle")}</dt>
            <dd className="mt-0.5 text-atlas-muted">
              {t("ritm.pension.get", { limit: lei(pensionDeductibleLimit()), amount: lei(value), tax: lei(taxSavedUpTo) })}
            </dd>
          </div>
          <div>
            <dt className="font-medium">{t("ritm.pension.catchTitle")}</dt>
            <dd className="mt-0.5 text-atlas-muted">{t("ritm.pension.catch")}</dd>
          </div>
        </dl>

        <p className="mt-4 rounded-2xl bg-ritm-tint px-4 py-3 text-sm">
          {t("ritm.pension.fund")}{" "}
          <a href={ASF_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-ritm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ritm">
            {t("ritm.pension.asfLink")}
          </a>
        </p>

        <label className="mt-5 flex flex-col gap-1.5 text-sm font-medium">
          {t("ritm.pension.amount")}
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
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

        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={!understood}
            className="min-h-12 rounded-full bg-ritm px-5 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm disabled:bg-ritm-track disabled:text-atlas-muted"
          >
            {t("ritm.pension.contribute", { amount: lei(value) })}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 rounded-full border border-atlas-line px-5 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm"
          >
            {t("ritm.pension.notNow")}
          </button>
        </div>
      </motion.section>
    </div>
  );
}
