"use client";

import { Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { useT } from "@/lib/i18n";
import { AtlasPeak, AtlasTile } from "./AtlasMark";
import { useFocusTrap } from "./useFocusTrap";
import { isFirstVisit, markWelcomeSeen, startOnPayday, useWelcome } from "./welcomeGuide";

/** The month, as the demo tells it. Days match the demo clock's jumps and the roadmap journey. */
const STOPS = [
  { key: "d1", day: 1 },
  { key: "d6", day: 6 },
  { key: "d20", day: 20 },
  { key: "d30", day: 30 },
] as const;

const noSubscribe = () => () => {};

/**
 * First visit on the plain link: what Atlas and Ritm are, the month on one route map, and one
 * button that starts the demo on payday. Reopened from "Guide" on Home and in Profile.
 */
export function Welcome() {
  const firstVisit = useSyncExternalStore(noSubscribe, isFirstVisit, () => false);
  const [dismissed, setDismissed] = useState(false);
  const reopened = useWelcome((s) => s.open);
  if (!(reopened || (firstVisit && !dismissed))) return null;
  return <WelcomeSheet onClose={() => setDismissed(true)} />;
}

function WelcomeSheet({ onClose }: { onClose: () => void }) {
  const t = useT();
  const router = useRouter();
  const reduce = useReducedMotion();
  const titleId = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useFocusTrap(dialog);
  useEffect(() => heading.current?.focus(), []);

  const close = () => {
    markWelcomeSeen();
    useWelcome.getState().hide();
    onClose();
  };
  const start = () => {
    onClose();
    startOnPayday(() => router.push("/"));
  };

  // One orchestrated entrance: the route draws down, the stops follow it.
  const stop = (i: number) =>
    reduce ? {} : { initial: { opacity: 0, x: -6 }, animate: { opacity: 1, x: 0 }, transition: { delay: 0.25 + i * 0.12, duration: 0.3 } };

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={(e) => e.key === "Escape" && close()}
      className="absolute inset-0 z-[65] flex flex-col overflow-y-auto overscroll-y-contain bg-atlas-paper text-atlas-ink [scrollbar-width:none]"
    >
      <div className="flex flex-col px-6 pt-9 pb-5">
        <AtlasTile className="size-14" />
        <h2 id={titleId} ref={heading} tabIndex={-1} className="mt-5 font-display text-[2rem] leading-[1.1] font-semibold tracking-[-0.02em] text-balance outline-none">
          {t("bank.welcome.title")}
        </h2>
        <p className="mt-3 leading-relaxed text-pretty text-atlas-ink/80">{t("bank.welcome.lead")}</p>

        <section aria-labelledby="welcome-map" className="mt-7">
          <h3 id="welcome-map" className="text-sm font-medium text-atlas-muted">
            {t("bank.welcome.mapTitle")}
          </h3>
          <ol className="relative mt-3">
            {/* The route: a dashed line through the stops, like a path on a map. */}
            <motion.span
              aria-hidden="true"
              className="absolute top-5 bottom-5 left-[1.1875rem] w-px origin-top bg-[repeating-linear-gradient(180deg,var(--atlas-pine)_0_5px,transparent_5px_10px)]"
              initial={reduce ? false : { scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            {STOPS.map(({ key, day }, i) => (
              <motion.li key={key} className="relative flex gap-4 py-2.5" {...stop(i)}>
                <span
                  className="relative z-10 flex size-10 shrink-0 flex-col items-center justify-center rounded-full border-2 border-atlas-pine bg-atlas-paper leading-none text-atlas-pine"
                  aria-hidden="true"
                >
                  <span className="text-[0.6rem] font-medium">{t("bank.welcome.dayShort")}</span>
                  <span className="font-display text-sm font-semibold tabular-nums">{day}</span>
                </span>
                <span className="min-w-0 pt-0.5">
                  <span className="block font-medium">
                    <span className="sr-only">{t("bank.welcome.day", { day })}: </span>
                    {t(`bank.welcome.stops.${key}.title`)}
                  </span>
                  <span className="block text-sm leading-snug text-atlas-muted">{t(`bank.welcome.stops.${key}.body`)}</span>
                </span>
              </motion.li>
            ))}
          </ol>
        </section>

        <p className="mt-5 flex gap-3 rounded-2xl bg-atlas-sea/70 p-4 text-sm leading-relaxed">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-atlas-pine" aria-hidden="true" />
          <span>{t("bank.welcome.simulated")}</span>
        </p>
        <p className="mt-4 text-center text-xs text-atlas-muted">{t("bank.welcome.reopen")}</p>
      </div>

      {/* Both choices stay on screen; the map scrolls under them on short phones. */}
      <div className="sticky bottom-0 mt-auto border-t border-atlas-line/70 bg-atlas-paper/95 px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={start}
            className="min-h-12 rounded-full bg-atlas-pine px-5 font-medium text-white transition-colors hover:bg-atlas-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine"
          >
            {t("bank.welcome.start")}
          </button>
          <button
            type="button"
            onClick={close}
            className="min-h-12 rounded-full px-5 font-medium text-atlas-pine transition-colors hover:bg-atlas-sea/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine"
          >
            {t("bank.welcome.later")}
          </button>
        </div>
      </div>
    </div>
  );
}

/** "Guide" button: reopens the welcome guide (Home greeting row, Profile). */
export function GuideButton({ className = "" }: { className?: string }) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={() => useWelcome.getState().show()}
      className={`flex min-h-11 items-center gap-1.5 rounded-full border border-atlas-line bg-white px-3.5 text-sm font-medium text-atlas-pine transition-colors hover:border-atlas-pine/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine ${className}`}
    >
      <AtlasPeak className="size-4" />
      {t("bank.welcome.guide")}
    </button>
  );
}
