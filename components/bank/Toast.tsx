"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { useT } from "@/lib/i18n";

/**
 * A short message that slides up above the bottom nav and hides itself after `durationMs`.
 * Announced to screen readers; respects prefers-reduced-motion.
 */
export function Toast({
  open,
  onClose,
  durationMs = 6000,
  children,
}: {
  open: boolean;
  onClose: () => void;
  durationMs?: number;
  children: ReactNode;
}) {
  const t = useT();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(onClose, durationMs);
    return () => clearTimeout(id);
  }, [open, onClose, durationMs]);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none sticky bottom-24 z-30 mt-auto px-4">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: reduce ? 0.1 : 0.25, ease: "easeOut" }}
            className="pointer-events-auto flex items-start gap-3 rounded-2xl bg-atlas-ink py-3 pr-2 pl-4 text-sm leading-relaxed text-white shadow-xl"
          >
            <div className="flex-1 pt-1">{children}</div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("bank.toast.close")}
              className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
