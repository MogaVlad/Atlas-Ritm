"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef } from "react";
import { RULES } from "@/lib/engine/config";
import { useT } from "@/lib/i18n";
import { useBank } from "./useBank";

/** Pages where the popup would get in the way. */
const HIDDEN_ON = ["/ritm/summary", "/ritm/onboarding"];

/**
 * Day 30 with Ritm on: a popup offers the month summary once. "Later" closes it; the
 * "See how the month went" button on the Ritm card stays where it is. Reset demo shows it again.
 * Rendered once in app/layout.tsx.
 */
export function SummaryPrompt() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const titleId = useId();
  const openRef = useRef<HTMLButtonElement>(null);
  const show = useBank(
    (s) => s.ritm.enabled && s.demoDay === RULES.cycleLength && !s.summaryPromptSeen && !HIDDEN_ON.some((p) => pathname.startsWith(p)),
  );
  const daysOnPace = useBank((s) => s.summary.daysOnPace);
  const dismiss = useBank((s) => s.dismissSummaryPrompt);

  useEffect(() => {
    if (show) openRef.current?.focus();
  }, [show]);

  if (!show) return null;

  const open = () => {
    dismiss();
    router.push("/ritm/summary");
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-atlas-ink/40 p-4 motion-safe:animate-in motion-safe:fade-in min-[500px]:items-center"
      onClick={dismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && dismiss()}
        className="w-full max-w-[358px] rounded-3xl bg-white p-6 shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-bottom-6 motion-safe:duration-300"
      >
        <h2 id={titleId} className="font-display text-2xl leading-tight font-semibold">
          {t("common.summaryPrompt.title")}
        </h2>
        <p className="mt-2 leading-snug text-atlas-muted">
          {t("common.summaryPrompt.body", { days: daysOnPace, total: RULES.cycleLength })}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            ref={openRef}
            type="button"
            onClick={open}
            className="min-h-12 rounded-full bg-ritm px-5 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm"
          >
            {t("common.summaryPrompt.open")}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="min-h-12 rounded-full border border-atlas-line bg-white px-5 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm"
          >
            {t("common.summaryPrompt.later")}
          </button>
        </div>
      </div>
    </div>
  );
}
