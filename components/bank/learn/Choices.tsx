"use client";

import { Check, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * A question with its options. Once answered, the right option turns green, a wrong pick red,
 * and the explanation shows. Not colour alone: "Right." / "Not quite." and icons say it too.
 * `base` is the message key holding q, a[] and why (e.g. bank.learn.q.q4).
 */
export function Choices({
  base,
  options,
  correct,
  chosen,
  onChoose,
  headingId,
}: {
  base: string;
  options: number;
  correct: number;
  chosen: number | null;
  onChoose: (i: number) => void;
  headingId: string;
}) {
  const t = useT();
  const heading = useRef<HTMLHeadingElement>(null);
  const answered = chosen !== null;
  const right = chosen === correct;

  // A new question: bring focus to it, so keyboard and screen-reader users start from the top.
  useEffect(() => {
    heading.current?.focus();
  }, [base]);

  return (
    <div className="flex flex-col gap-4">
      <h2 id={headingId} ref={heading} tabIndex={-1} className="font-display text-xl leading-snug font-semibold text-pretty outline-none">
        {t(`${base}.q`)}
      </h2>
      <ul className="flex flex-col gap-2">
        {Array.from({ length: options }, (_, i) => {
          const isRight = answered && i === correct;
          const isWrongPick = answered && i === chosen && !right;
          return (
            <li key={i}>
              <button
                type="button"
                // aria-disabled, not disabled: focus stays on the pick, so Tab leads on to the next button.
                onClick={() => !answered && onChoose(i)}
                aria-disabled={answered || undefined}
                aria-pressed={chosen === i}
                className={cn(
                  "flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine",
                  !answered && "bg-white ring-atlas-line hover:ring-atlas-pine/50",
                  isRight && "bg-atlas-sea ring-atlas-pine",
                  isWrongPick && "bg-ritm-spike-tint ring-ritm-spike",
                  answered && !isRight && !isWrongPick && "bg-white text-atlas-muted ring-atlas-line",
                )}
              >
                <span className="flex-1 leading-snug">{t(`${base}.a.${i}`)}</span>
                {isRight && <Check className="size-5 shrink-0 text-atlas-pine" aria-hidden="true" />}
                {isWrongPick && <X className="size-5 shrink-0 text-ritm-spike" aria-hidden="true" />}
              </button>
            </li>
          );
        })}
      </ul>
      <div aria-live="polite">
        {answered && (
          <p className={cn("rounded-2xl px-4 py-3 text-sm leading-relaxed", right ? "bg-atlas-sea/70" : "bg-atlas-paper ring-1 ring-atlas-line")}>
            <strong className="font-semibold">{t(right ? "bank.learn.test.right" : "bank.learn.test.wrong")}</strong> {t(`${base}.why`)}
          </p>
        )}
      </div>
    </div>
  );
}
