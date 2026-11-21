"use client";

import { useEffect, useId, useState } from "react";
import { RULES } from "@/lib/engine/config";
import { useT } from "@/lib/i18n";
import { useBank } from "./useBank";

const JUMPS = [1, 6, 20, 30] as const;

/**
 * The demo clock. Visible only with ?demo=1 in the URL.
 * Day slider, jumps to day 1/6/20/30 and Reset demo.
 */
export function DemoControls() {
  const t = useT();
  const sliderId = useId();
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const demoDay = useBank((s) => s.demoDay);
  const setDemoDay = useBank((s) => s.setDemoDay);
  const resetDemo = useBank((s) => s.resetDemo);
  const severity = useBank((s) => s.pace.severity);

  // Read the URL in an effect: browser-only, keeps the page prerenderable.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a browser-only value
      setEnabled(new URLSearchParams(window.location.search).get("demo") === "1");
    } catch {
      /* no URL: stay hidden */
    }
  }, []);

  if (!enabled) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <section
          aria-label={t("common.demo.title")}
          className="w-72 rounded-2xl border bg-background p-4 text-sm shadow-2xl"
        >
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">{t("common.demo.title")}</h2>
            <span className="text-muted-foreground tabular-nums">
              {t("common.demo.day", { day: demoDay })} · {t(`common.demo.severity.${severity}`)}
            </span>
          </div>

          <label htmlFor={sliderId} className="mt-3 block text-muted-foreground">
            {t("common.demo.slider")}
          </label>
          <input
            id={sliderId}
            type="range"
            min={1}
            max={RULES.cycleLength}
            value={demoDay}
            onChange={(e) => setDemoDay(Number(e.target.value))}
            className="mt-1 w-full accent-foreground"
          />

          <div className="mt-3 grid grid-cols-4 gap-2">
            {JUMPS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => setDemoDay(day)}
                aria-pressed={demoDay === day}
                className="min-h-11 rounded-lg bg-muted font-medium tabular-nums focus-visible:outline-2 focus-visible:outline-ring aria-pressed:bg-foreground aria-pressed:text-background"
              >
                {day}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={resetDemo}
            className="mt-3 min-h-11 w-full rounded-lg border font-medium focus-visible:outline-2 focus-visible:outline-ring"
          >
            {t("common.demo.reset")}
          </button>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="min-h-11 rounded-full bg-foreground px-4 text-sm font-medium text-background shadow-lg focus-visible:outline-2 focus-visible:outline-ring"
      >
        {t("common.demo.button", { day: demoDay })}
      </button>
    </div>
  );
}
