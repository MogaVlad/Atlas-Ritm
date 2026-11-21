"use client";

import { ChevronRight, TriangleAlert } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useT } from "@/lib/i18n";
import { useBank, type HeadsUpNotification } from "@/lib/store/useBank";
import { cn } from "@/lib/utils";
import { HeadsUpSheet } from "./HeadsUpSheet";

/**
 * Heads-ups the user put off with "Later". Module-level, so it survives moving between pages;
 * a reload shows the pop-up again (the Heads-up is still waiting).
 */
const later = new Set<string>();

const TONE = { ok: "", watch: "bg-ritm-watch-tint text-ritm-watch", spike: "bg-ritm-spike-tint text-ritm-spike" } as const;

/**
 * The newest waiting Heads-up as a card above the bottom navigation on Home, so "why did Ritm
 * speak up?" is one tap away without scrolling to the Ritm card. It stays until the user opens
 * it or taps "Later"; "Later" does not count as ignoring the alert (it stays in the bell).
 */
export function HeadsUpPopup() {
  const t = useT();
  const pathname = usePathname();
  // Up to today only: after stepping back a day in the demo, later Heads-ups are still queued.
  const latest = useBank((s) => s.notifications.findLast((n) => n.day <= s.demoDay));
  const [, setHidden] = useState(0);
  const [sheet, setSheet] = useState<HeadsUpNotification | null>(null);

  const visible = pathname === "/" && latest && !later.has(latest.id) && !sheet ? latest : null;
  const reason = visible?.reasons[0];

  return (
    <>
      {visible && (
        <div
          role="region"
          aria-label={t("ritm.popup.title")}
          className="absolute inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 flex items-stretch gap-1 rounded-3xl bg-white p-1.5 shadow-[0_16px_40px_-12px_rgb(14_47_44/0.45)] ring-1 ring-atlas-line motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-6 motion-safe:duration-300"
        >
          <button
            type="button"
            onClick={() => setSheet(visible)}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-[20px] p-2.5 text-left focus-visible:outline-2 focus-visible:outline-ritm"
          >
            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", TONE[visible.severity])} aria-hidden="true">
              <TriangleAlert className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{t("ritm.popup.title")}</span>
              {reason && <span className="line-clamp-2 block text-sm leading-snug text-atlas-muted">{t(reason.key, reason.values)}</span>}
              <span className="mt-1 flex items-center gap-0.5 text-sm font-medium text-ritm">
                {t("ritm.popup.cta")}
                <ChevronRight className="size-4" aria-hidden="true" />
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              later.add(visible.id);
              setHidden((n) => n + 1);
            }}
            className="shrink-0 self-start rounded-full px-3 py-2.5 text-sm font-medium text-atlas-muted min-h-11 focus-visible:outline-2 focus-visible:outline-ritm"
          >
            {t("ritm.popup.later")}
          </button>
        </div>
      )}

      {sheet && <HeadsUpSheet notification={sheet} onClose={() => setSheet(null)} />}
    </>
  );
}
