"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { RULES } from "@/lib/engine/config";
import { useT } from "@/lib/i18n";
import { DEMOS, startDemo, type DemoId } from "./demos";
import { useBank } from "./useBank";

const JUMPS = [1, 6, 20, 30] as const;
const MODE_KEY = "atlas-demo-mode";

/** Demo mode is remembered in this browser, so a reload or a typed URL keeps the panel. */
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

function writeMode(on: boolean) {
  try {
    if (on) window.localStorage.setItem(MODE_KEY, "1");
    else window.localStorage.removeItem(MODE_KEY);
  } catch {
    /* storage blocked: the mode lasts until the page reloads */
  }
}

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/**
 * Demo tools.
 * - Top left, always: "Demo-uri" opens the list of demos (lib/store/demos.ts).
 * - Bottom right, in demo mode (a demo was picked, or ?demo=1): day slider, jumps to day 1/6/20/30, Reset demo.
 */
export function DemoControls() {
  const t = useT();
  const router = useRouter();
  const sliderId = useId();
  const menuId = useId();
  const [mode, setMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const demoDay = useBank((s) => s.demoDay);
  const setDemoDay = useBank((s) => s.setDemoDay);
  const resetDemo = useBank((s) => s.resetDemo);
  const severity = useBank((s) => s.pace.severity);

  // Browser-only values, read once after mount (keeps the page prerenderable).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a browser-only value
    setMode(readMode());
  }, []);

  // Close the menu on Escape or a click outside it.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [menuOpen]);

  function pick(id: DemoId) {
    const path = startDemo(id, useBank.getState);
    writeMode(true);
    setMode(true);
    setMenuOpen(false);
    setPanelOpen(false);
    router.push(path);
  }

  function exitDemo() {
    writeMode(false);
    setMode(false);
    setMenuOpen(false);
    setPanelOpen(false);
  }

  return (
    <>
      {/* Top left: outside the phone on a laptop; above the bottom bar on a real phone. */}
      <div
        ref={menuRef}
        className="fixed bottom-20 left-4 z-50 flex flex-col-reverse items-start gap-2 min-[500px]:top-4 min-[500px]:bottom-auto min-[500px]:flex-col"
      >
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-controls={menuId}
          className={`min-h-11 rounded-full bg-foreground px-4 text-sm font-medium text-background shadow-lg ${FOCUS}`}
        >
          {t("common.demo.menu")}
        </button>

        {menuOpen && (
          <nav id={menuId} aria-label={t("common.demo.menu")} className="w-72 rounded-2xl border bg-background p-2 text-sm shadow-2xl">
            <ul className="flex flex-col">
              {DEMOS.map((demo) => (
                <li key={demo.id}>
                  <button
                    type="button"
                    onClick={() => pick(demo.id)}
                    className={`flex min-h-11 w-full flex-col items-start rounded-xl px-3 py-2 text-left hover:bg-muted ${FOCUS}`}
                  >
                    <span className="flex w-full items-baseline justify-between gap-2">
                      <span className="font-medium">{t(`common.demo.list.${demo.id}.title`)}</span>
                      <span className="shrink-0 text-muted-foreground tabular-nums">{t("common.demo.day", { day: demo.day })}</span>
                    </span>
                    <span className="text-muted-foreground">{t(`common.demo.list.${demo.id}.body`)}</span>
                  </button>
                </li>
              ))}
            </ul>
            {mode && (
              <button
                type="button"
                onClick={exitDemo}
                className={`mt-1 min-h-11 w-full rounded-xl border-t px-3 text-left text-muted-foreground hover:bg-muted ${FOCUS}`}
              >
                {t("common.demo.exit")}
              </button>
            )}
          </nav>
        )}
      </div>

      {mode && (
        <div className="fixed right-4 bottom-20 z-50 flex flex-col items-end gap-2 min-[500px]:bottom-4">
          {panelOpen && (
            <section aria-label={t("common.demo.title")} className="w-72 rounded-2xl border bg-background p-4 text-sm shadow-2xl">
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
                    className={`min-h-11 rounded-lg bg-muted font-medium tabular-nums aria-pressed:bg-foreground aria-pressed:text-background ${FOCUS}`}
                  >
                    {day}
                  </button>
                ))}
              </div>

              <button type="button" onClick={resetDemo} className={`mt-3 min-h-11 w-full rounded-lg border font-medium ${FOCUS}`}>
                {t("common.demo.reset")}
              </button>
            </section>
          )}

          <button
            type="button"
            onClick={() => setPanelOpen((o) => !o)}
            aria-expanded={panelOpen}
            className={`min-h-11 rounded-full bg-foreground px-4 text-sm font-medium text-background shadow-lg ${FOCUS}`}
          >
            {t("common.demo.button", { day: demoDay })}
          </button>
        </div>
      )}
    </>
  );
}
