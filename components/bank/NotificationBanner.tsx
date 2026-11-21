"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { HeadsUpSheet } from "@/components/ritm/HeadsUpSheet";
import { headsUpLine, headsUpTitleKey } from "@/components/ritm/headsUpText";
import { useT } from "@/lib/i18n";
import { useBank, type HeadsUpNotification } from "@/lib/store/useBank";
import { AtlasGlobe } from "./AtlasMark";
import { markBannered, nextUnbannered } from "./notifications";

const SHOW_MS = 7000;

/**
 * Phone-style banner that slides down from the top when a new Heads-up joins the store's queue.
 * Tap it to open Horia's <HeadsUpSheet/>; swipe it up or wait and it hides (the Heads-up stays
 * in the bell's notification centre). Hiding the banner does not count as ignoring the alert.
 */
export function NotificationBanner() {
  const t = useT();
  const reduce = useReducedMotion();
  const queue = useBank((s) => s.notifications);
  const [current, setCurrent] = useState<HeadsUpNotification | null>(() => {
    const s = useBank.getState();
    return nextUnbannered(s.notifications, s.demoDay);
  });
  const [sheet, setSheet] = useState<HeadsUpNotification | null>(null);

  // New Heads-ups (day jumps, or the saved demo loading after a reload) → show the newest unseen one.
  useEffect(
    () =>
      useBank.subscribe((s, prev) => {
        if (s.notifications === prev.notifications && s.demoDay === prev.demoDay) return;
        const next = nextUnbannered(s.notifications, s.demoDay);
        if (next) setCurrent(next);
      }),
    [],
  );

  // Only shown once per notification; hides by itself after a few seconds.
  useEffect(() => {
    if (!current) return;
    markBannered(current.id);
    const id = setTimeout(() => setCurrent(null), SHOW_MS);
    return () => clearTimeout(id);
  }, [current]);

  // Handled elsewhere (e.g. from the Ritm card) → the banner has nothing left to say.
  const visible = current && !sheet && queue.some((n) => n.id === current.id) ? current : null;
  const firstReason = visible ? headsUpLine(visible) : null;

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            key={visible.id}
            role="status"
            aria-live="polite"
            initial={reduce ? { opacity: 0 } : { y: "-120%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "-120%" }}
            transition={reduce ? { duration: 0.1 } : { type: "spring", stiffness: 420, damping: 34 }}
            drag={reduce ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.6, bottom: 0.1 }}
            onDragEnd={(_, info) => {
              if (info.offset.y < -24) setCurrent(null);
            }}
            className="absolute inset-x-2 top-2 z-[35] flex items-start gap-1 rounded-[22px] bg-white/90 p-1 shadow-[0_12px_32px_-8px_rgb(14_47_44/0.35)] ring-1 ring-atlas-line/80 backdrop-blur-md"
          >
            <button
              type="button"
              onClick={() => {
                setSheet(visible);
                setCurrent(null);
              }}
              className="flex min-w-0 flex-1 items-start gap-3 rounded-[18px] p-2.5 text-left focus-visible:outline-2 focus-visible:outline-atlas-pine"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-atlas-pine text-white" aria-hidden="true">
                <AtlasGlobe className="size-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2 text-xs text-atlas-muted">
                  <span>{t("bank.notifications.app")}</span>
                  <span>{t("bank.notifications.now")}</span>
                </span>
                <span className="mt-0.5 block text-sm leading-snug font-semibold text-atlas-ink">
                  {t(headsUpTitleKey(visible))}
                </span>
                {firstReason && (
                  <span className="mt-0.5 line-clamp-2 block text-sm leading-snug text-atlas-ink/80">
                    {t(firstReason.key, firstReason.values)}
                  </span>
                )}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setCurrent(null)}
              aria-label={t("bank.notifications.hide")}
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-atlas-muted hover:bg-atlas-sea/60 focus-visible:outline-2 focus-visible:outline-atlas-pine"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {sheet && <HeadsUpSheet notification={sheet} onClose={() => setSheet(null)} />}
    </>
  );
}
