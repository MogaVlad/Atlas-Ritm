"use client";

import { useState } from "react";
import { LocaleToggle } from "@/components/bank/LocaleToggle";
import { LevelChips, type RitmLevel } from "@/components/ritm/LevelChips";
import { PaceBar, type PaceSeverity } from "@/components/ritm/PaceBar";
import { SafeToSpend } from "@/components/ritm/SafeToSpend";
import { useHtmlLang, useT } from "@/lib/i18n";

// Mock values from the roadmap's day-6 spike (1,166 of 2,120 lei spent). Replaced by the engine at Gate 2.
const STATES: { day: number; spent: number; severity: PaceSeverity; safe: number }[] = [
  { day: 3, spent: 0.08, severity: "ok", safe: 72.4 },
  { day: 6, spent: 0.55, severity: "spike", safe: 38.16 },
  { day: 15, spent: 0.62, severity: "watch", safe: 53.33 },
];

export default function RitmPlayground() {
  useHtmlLang();
  const t = useT();
  const [level, setLevel] = useState<RitmLevel>("headsup");
  const [i, setI] = useState(1);
  const s = STATES[i];

  return (
    <>
      <header className="flex items-center justify-between px-5 pt-6">
        <h1 className="text-lg font-semibold">{t("ritm.playground.title")}</h1>
        <LocaleToggle />
      </header>

      <main className="flex flex-col gap-8 px-5 py-8">
        <div role="group" aria-label={t("ritm.playground.pickDay")} className="flex gap-2">
          {STATES.map((st, idx) => (
            <button
              key={st.day}
              type="button"
              aria-pressed={i === idx}
              onClick={() => setI(idx)}
              className="min-h-11 flex-1 rounded-xl bg-muted text-sm font-medium focus-visible:outline-2 focus-visible:outline-ritm aria-pressed:bg-foreground aria-pressed:text-background"
            >
              {t("ritm.playground.day", { day: st.day })}
            </button>
          ))}
        </div>

        <SafeToSpend amount={s.safe} line={t(`ritm.safe.line.${s.severity}`)} />
        <PaceBar pctSpent={s.spent} pctMonthPassed={s.day / 30} severity={s.severity} dayOfCycle={s.day} cycleLength={30} />

        <section className="flex flex-col gap-3">
          <h2 className="text-sm text-muted-foreground">{t("ritm.levels.label")}</h2>
          <LevelChips value={level} onChange={setLevel} />
        </section>
      </main>
    </>
  );
}
