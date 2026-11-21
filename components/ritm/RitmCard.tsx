"use client";

import { Activity, ChevronRight, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { AskRitmSheet } from "@/components/bank/AskRitmSheet";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { useBank, type HeadsUpNotification } from "@/lib/store/useBank";
import { HeadsUpSheet } from "./HeadsUpSheet";
import { PaceBar, PaceStatus } from "./PaceBar";
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
    <section aria-labelledby="ritm-card-title" className="flex flex-col gap-4 rounded-[28px] bg-white p-5 ring-1 ring-atlas-line">
      {/* Redesign: the status first, then Ritm in one plain sentence, so nobody has to decode the bar. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="ritm-card-title" className="flex items-center gap-2 font-display text-xl font-bold tracking-[-0.02em]">
          <Activity className="size-5 text-ritm" strokeWidth={2.4} aria-hidden="true" />
          {t("ritm.card.title")}
        </h2>
        <PaceStatus severity={pace.severity} />
      </div>
      <p className="text-[0.95rem] leading-snug">
        {t("ritm.card.sentence", { spent: Math.round(pace.pctSpent * 100), month: Math.round(pace.pctMonthPassed * 100) })}
      </p>

      <PaceBar
        pctSpent={pace.pctSpent}
        pctMonthPassed={pace.pctMonthPassed}
        severity={pace.severity}
        dayOfCycle={pace.dayOfCycle}
        cycleLength={pace.cycleLength}
        showStatus={false}
      />

      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-atlas-line pt-4">
        <SafeToSpend amount={pace.safeToSpendToday} line={t(safeLineKey(pace))} />
        <Link
          href="/ritm"
          className="flex min-h-11 items-center gap-1 rounded-full bg-ritm pr-3 pl-4 text-[0.95rem] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm"
        >
          {t("ritm.card.openCta")}
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      {active.length > 0 && (
        <p className="text-sm text-atlas-muted">
          {t("ritm.card.activeLine", { list: active.map((f) => t(`ritm.levels.${f}.name`)).join(" · ") })}
        </p>
      )}

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
