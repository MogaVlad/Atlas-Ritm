"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";
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
  // Next keeps hidden routes alive (<Activity>): don't come back to a sheet left open.
  useLayoutEffect(() => () => setSheet(null), []);

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

      {lock && lock.amount > 0 && (
        <Link
          href={lock.status === "unlocked" ? "/ritm/unlock" : "/ritm/lock"}
          className="-mx-2 flex min-h-11 items-center justify-between gap-2 rounded-lg border-t border-atlas-line px-2 pt-4 text-sm focus-visible:outline-2 focus-visible:outline-ritm"
        >
          <span>
            {lock.status === "unlocked"
              ? t("ritm.card.lockOpen", { amount: formatLei(lock.amount, locale) })
              : t("ritm.card.lock", { amount: formatLei(lock.amount, locale), day: lock.unlockDay })}
          </span>
          <ChevronRight className="size-4 shrink-0 text-atlas-muted" aria-hidden="true" />
        </Link>
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
