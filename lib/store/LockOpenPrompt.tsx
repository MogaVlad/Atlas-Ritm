"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef } from "react";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { useBank } from "./useBank";

/** Pages where the popup would get in the way (the unlock screen is where it leads). */
const HIDDEN_ON = ["/ritm/unlock", "/ritm/onboarding", "/ritm/summary"];

/**
 * The Lock just opened (its day came, or an early unlock was released): a popup says so once and
 * leads to the unlock screen, where the user chooses how much stays saved. "Later" closes it; the
 * Ritm card still links there. A new Lock shows it again. Rendered once in app/layout.tsx.
 */
export function LockOpenPrompt() {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const router = useRouter();
  const pathname = usePathname();
  const titleId = useId();
  const openRef = useRef<HTMLButtonElement>(null);
  const lock = useBank((s) => s.lock);
  const day = useBank((s) => s.demoDay);
  const seen = useBank((s) => s.lockPromptSeen);
  const dismiss = useBank((s) => s.dismissLockPrompt);
  const show =
    lock !== null && lock.status === "unlocked" && lock.amount > 0 && !seen && !HIDDEN_ON.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (show) openRef.current?.focus();
  }, [show]);

  if (!show) return null;

  const open = () => {
    dismiss();
    router.push("/ritm/unlock");
  };
  const amount = formatLei(lock.amount, locale);
  // Opened by itself on its day, or released after an early request.
  const early = lock.requestedAtDay !== undefined && day < lock.unlockDay;

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
          {t("common.lockPrompt.title")}
        </h2>
        <p className="mt-2 leading-snug text-atlas-muted">
          {early ? t("common.lockPrompt.bodyEarly", { amount }) : t("common.lockPrompt.body", { amount, day: lock.unlockDay })}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            ref={openRef}
            type="button"
            onClick={open}
            className="min-h-12 rounded-full bg-ritm px-5 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm"
          >
            {t("common.lockPrompt.open")}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="min-h-12 rounded-full border border-atlas-line bg-white px-5 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm"
          >
            {t("common.lockPrompt.later")}
          </button>
        </div>
      </div>
    </div>
  );
}
