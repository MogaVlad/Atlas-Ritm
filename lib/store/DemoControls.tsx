"use client";

import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { RULES } from "@/lib/engine/config";
import { useT } from "@/lib/i18n";
import { useBank } from "./useBank";

const MODE_KEY = "atlas-demo-mode";

/** Demo mode is remembered in this browser, so a reload or a typed URL keeps the controls. */
function readMode(): boolean {
  try {
    const param = new URLSearchParams(window.location.search).get("demo");
    if (param === "1") window.localStorage.setItem(MODE_KEY, "1");
    if (param === "0") window.localStorage.removeItem(MODE_KEY);
    return window.localStorage.getItem(MODE_KEY) === "1";
  } catch {
    return false;
  }
}

const BUTTON =
  "flex size-9 min-[500px]:size-11 items-center justify-center rounded-full transition-colors hover:bg-white/15 disabled:opacity-35 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/**
 * The demo clock: one small pill with previous day, the day, next day and Reset demo.
 * Visible in demo mode (?demo=1, remembered; ?demo=0 turns it off). On a laptop it sits
 * outside the phone, bottom right. On a phone it sits in the empty middle of the top bar,
 * so it never covers a Confirm button at the bottom; Reset is laptop-only there for room.
 *
 * The day slider and the "Demo-uri" menu (lib/store/demos.ts) are switched off for now.
 */
export function DemoControls() {
  const t = useT();
  const [mode, setMode] = useState(false);
  const demoDay = useBank((s) => s.demoDay);
  const setDemoDay = useBank((s) => s.setDemoDay);
  const resetDemo = useBank((s) => s.resetDemo);

  // Browser-only value, read once after mount (keeps the page prerenderable).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a browser-only value
    setMode(readMode());
  }, []);

  if (!mode) return null;

  return (
    <div
      role="group"
      aria-label={t("common.demo.title")}
      className="fixed top-2.5 left-1/2 z-50 flex -translate-x-[70%] items-center rounded-full bg-foreground/85 text-xs font-medium text-background shadow-lg backdrop-blur min-[500px]:top-auto min-[500px]:right-4 min-[500px]:bottom-4 min-[500px]:left-auto min-[500px]:translate-x-0 min-[500px]:p-0.5 min-[500px]:text-sm"
    >
      <button
        type="button"
        onClick={() => setDemoDay(demoDay - 1)}
        disabled={demoDay <= 1}
        aria-label={t("common.demo.prevDay")}
        className={BUTTON}
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
      </button>
      <span className="min-w-12 text-center tabular-nums min-[500px]:min-w-16" aria-live="polite">
        {t("common.demo.day", { day: demoDay })}
      </span>
      <button
        type="button"
        onClick={() => setDemoDay(demoDay + 1)}
        disabled={demoDay >= RULES.cycleLength}
        aria-label={t("common.demo.nextDay")}
        className={BUTTON}
      >
        <ChevronRight className="size-5" aria-hidden="true" />
      </button>
      <span className="mx-0.5 hidden h-6 w-px bg-background/25 min-[500px]:block" aria-hidden="true" />
      <button type="button" onClick={resetDemo} aria-label={t("common.demo.reset")} className={`${BUTTON} max-[499px]:hidden`}>
        <RotateCcw className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
