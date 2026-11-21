"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { useBank } from "@/lib/store/useBank";
import { MonthSummary } from "./MonthSummary";

const PRIMARY =
  "min-h-12 rounded-full bg-ritm px-5 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm";
const SECONDARY =
  "min-h-12 rounded-full border border-atlas-line bg-white px-5 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm";

/** The month summary as a window over Home, with a close button. */
export function MonthSummaryDialog({ onClose }: { onClose: () => void }) {
  const t = useT();
  const titleId = useId();
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => title.current?.focus(), []);

  return (
    <div className="absolute inset-0 z-40 flex items-end bg-atlas-ink/40 motion-safe:animate-in motion-safe:fade-in" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        className="max-h-[92%] w-full overflow-y-auto rounded-t-3xl bg-atlas-paper px-5 pb-8 shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-bottom-10 motion-safe:duration-300"
      >
        <div className="sticky top-0 z-10 -mx-5 flex justify-end bg-atlas-paper/95 px-3 pt-2 backdrop-blur">
          <button
            type="button"
            onClick={onClose}
            aria-label={t("ritm.summary.window.close")}
            className="flex size-11 items-center justify-center rounded-full text-atlas-muted focus-visible:outline-2 focus-visible:outline-ritm"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <MonthSummary titleId={titleId} titleRef={title} />
      </div>
    </div>
  );
}

/** Opens by itself when the demo reaches payday (day 30): the month is over, see how it went. */
export function PaydayWindow({ onOpenSummary, onClose }: { onOpenSummary: () => void; onClose: () => void }) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const summary = useBank((s) => s.summary);
  const titleId = useId();
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => title.current?.focus(), []);

  const line =
    summary.overspent > 0
      ? t("ritm.summary.window.bodyOver")
      : t("ritm.summary.window.body", { left: formatLei(summary.leftOfSpendingMoney, locale) });

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-atlas-ink/40 px-6 motion-safe:animate-in motion-safe:fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        className="flex w-full flex-col gap-3 rounded-3xl bg-white p-6 text-center shadow-2xl motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:duration-200"
      >
        <h2 id={titleId} ref={title} tabIndex={-1} className="font-display text-2xl leading-tight font-semibold outline-none">
          {t("ritm.summary.titlePayday")}
        </h2>
        <p className="text-atlas-muted">{line}</p>
        <div className="mt-3 flex flex-col gap-3">
          <button type="button" onClick={onOpenSummary} className={PRIMARY}>
            {t("ritm.card.summaryCta")}
          </button>
          <button type="button" onClick={onClose} className={SECONDARY}>
            {t("ritm.summary.window.later")}
          </button>
        </div>
      </div>
    </div>
  );
}
