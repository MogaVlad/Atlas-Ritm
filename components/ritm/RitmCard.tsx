"use client";

import { useState } from "react";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { useBank, type HeadsUpNotification } from "@/lib/store/useBank";
import { HeadsUpSheet } from "./HeadsUpSheet";
import { PaceBar } from "./PaceBar";
import { SafeToSpend } from "./SafeToSpend";

/** Ritm on the Atlas Home screen: what's safe today, the month's pace, level and Lock. */
export function RitmCard() {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const pace = useBank((s) => s.pace);
  const level = useBank((s) => s.ritm.level);
  const lock = useBank((s) => s.lock);
  const latest = useBank((s) => s.notifications.at(-1));
  const [sheet, setSheet] = useState<HeadsUpNotification | null>(null);

  return (
    <section aria-labelledby="ritm-card-title" className="flex flex-col gap-5 rounded-3xl bg-white p-5 ring-1 ring-atlas-line">
      <div className="flex items-center justify-between gap-3">
        <h2 id="ritm-card-title" className="font-display text-lg font-semibold">
          {t("ritm.card.title")}
        </h2>
        <span className="rounded-full bg-ritm-tint px-3 py-1 text-sm font-medium text-ritm">{t(`ritm.levels.${level}.name`)}</span>
      </div>

      <SafeToSpend amount={pace.safeToSpendToday} line={t(`ritm.safe.line.${pace.severity}`)} />
      <PaceBar
        pctSpent={pace.pctSpent}
        pctMonthPassed={pace.pctMonthPassed}
        severity={pace.severity}
        dayOfCycle={pace.dayOfCycle}
        cycleLength={pace.cycleLength}
      />

      {lock && lock.status !== "unlocked" && lock.amount > 0 && (
        <p className="border-t border-atlas-line pt-4 text-sm">
          {t("ritm.card.lock", { amount: formatLei(lock.amount, locale), day: lock.unlockDay })}
        </p>
      )}

      {latest && (
        <button
          type="button"
          onClick={() => setSheet(latest)}
          className="min-h-12 rounded-full bg-ritm px-5 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm"
        >
          {t("ritm.card.headsUpCta")}
        </button>
      )}

      {sheet && <HeadsUpSheet notification={sheet} onClose={() => setSheet(null)} />}
    </section>
  );
}
