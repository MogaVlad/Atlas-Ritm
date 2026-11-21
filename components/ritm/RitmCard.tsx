"use client";

import { ChevronRight, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { AskRitmSheet } from "@/components/bank/AskRitmSheet";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { useBank, type HeadsUpNotification } from "@/lib/store/useBank";
import { HeadsUpSheet } from "./HeadsUpSheet";
import { PaceBar } from "./PaceBar";
import { SafeToSpend, safeLineKey } from "./SafeToSpend";

/** Ritm on the Atlas Home screen: what's safe today, the month's pace, level and Lock. */
export function RitmCard() {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const pace = useBank((s) => s.pace);
  const headsUp = useBank((s) => s.ritm.headsUp);
  const speedBump = useBank((s) => s.ritm.speedBump);
  const lock = useBank((s) => s.lock);
  // Chosen in onboarding but the salary isn't in yet: the Lock is taken on payday.
  const plannedLock = useBank((s) => (!s.lock && s.ritm.lock.amount > 0 ? s.ritm.lock.amount : 0));
  const lockOn = (lock && lock.status !== "unlocked" && lock.amount > 0) || plannedLock > 0;
  // The features that are on, as small tags next to the title.
  const active = [headsUp && "headsup", speedBump && "speedbump", lockOn && "lock"].filter(
    (f): f is string => typeof f === "string",
  );
  const latest = useBank((s) => s.notifications.at(-1));
  const [sheet, setSheet] = useState<HeadsUpNotification | null>(null);
  const [askOpen, setAskOpen] = useState(false);
  // Next keeps hidden routes alive (<Activity>): don't come back to a sheet left open.
  useLayoutEffect(
    () => () => {
      setSheet(null);
      setAskOpen(false);
    },
    [],
  );

  return (
    <section aria-labelledby="ritm-card-title" className="flex flex-col gap-5 rounded-3xl bg-white p-5 ring-1 ring-atlas-line">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="ritm-card-title" className="font-display text-lg font-semibold">
          {t("ritm.card.title")}
        </h2>
        <ul className="flex flex-wrap gap-1.5">
          {active.map((f) => (
            <li key={f} className="rounded-full bg-ritm-tint px-3 py-1 text-sm font-medium text-ritm">
              {t(`ritm.levels.${f}.name`)}
            </li>
          ))}
        </ul>
      </div>

      <SafeToSpend amount={pace.safeToSpendToday} line={t(safeLineKey(pace))} />
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
      {plannedLock > 0 && (
        <p className="-mx-2 border-t border-atlas-line px-2 pt-4 text-sm">
          {t("ritm.features.lockPending", { amount: formatLei(plannedLock, locale) })}
        </p>
      )}

      {pace.dayOfCycle === pace.cycleLength && (
        <Link
          href="/ritm/summary"
          className="flex min-h-12 items-center justify-center rounded-full border border-atlas-line px-5 font-medium text-ritm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm"
        >
          {t("ritm.card.summaryCta")}
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

      <button
        type="button"
        onClick={() => setAskOpen(true)}
        aria-haspopup="dialog"
        className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-atlas-line px-5 font-medium text-ritm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm"
      >
        <MessageCircle className="size-5" aria-hidden="true" />
        {t("ritm.card.askCta")}
      </button>

      {sheet && <HeadsUpSheet notification={sheet} onClose={() => setSheet(null)} />}
      {askOpen && <AskRitmSheet onClose={() => setAskOpen(false)} />}
    </section>
  );
}
