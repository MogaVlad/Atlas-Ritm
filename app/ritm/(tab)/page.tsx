"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FeatureSwitches, useLockLink } from "@/components/ritm/FeatureSwitches";
import { PaceBar, PaceStatus } from "@/components/ritm/PaceBar";
import { SafeToSpend, safeLineKey } from "@/components/ritm/SafeToSpend";
import { useHydrated } from "@/components/ritm/useHydrated";
import { NET_SALARY } from "@/lib/data/persona";
import { goalMonthly, goalsPlan } from "@/lib/engine";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { useBank } from "@/lib/store/useBank";

/** The Ritm tab. Ritm off → onboarding; on → the card, the level and what's set up. */
export default function RitmTab() {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const router = useRouter();
  const hydrated = useHydrated();
  const ritm = useBank((s) => s.ritm);
  const lock = useBank((s) => s.lock);
  const pace = useBank((s) => s.pace);
  const setFeature = useBank((s) => s.setFeature);
  const lockLink = useLockLink();

  useEffect(() => {
    if (hydrated && !ritm.enabled) router.replace("/ritm/onboarding");
  }, [hydrated, ritm.enabled, router]);

  if (!hydrated || !ritm.enabled) return null;

  const locked = lock && lock.status !== "unlocked" && lock.amount > 0;
  const goals = goalsPlan(ritm.goals, NET_SALARY);

  return (
    <div className="flex flex-col gap-6">
      {/* Redesign: the one number that matters, big, on Ritm's cobalt. Then the pace that explains it. */}
      <section className="-mx-5 -mt-5 flex flex-col gap-4 rounded-b-[32px] bg-ritm px-5 pt-3 pb-7 text-white">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-[1.7rem] leading-tight font-bold tracking-[-0.02em]">{t("ritm.tab.title")}</h1>
          <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold tabular-nums">
            {t("ritm.tab.dayPill", { day: Math.max(pace.dayOfCycle, 0), total: pace.cycleLength })}
          </span>
        </div>
        <SafeToSpend amount={pace.safeToSpendToday} line={t(safeLineKey(pace))} tone="inverse" size="hero" />
      </section>

      {/* Not <RitmCard/>: Next keeps this page alive while hidden, and Home already has the card. */}
      <section aria-labelledby="ritm-pace" className="flex flex-col gap-4 rounded-[24px] bg-white p-5 ring-1 ring-atlas-line">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="ritm-pace" className="font-display text-lg font-bold">
            {t("ritm.tab.paceTitle")}
          </h2>
          <PaceStatus severity={pace.severity} />
        </div>
        <PaceBar
          pctSpent={pace.pctSpent}
          pctMonthPassed={pace.pctMonthPassed}
          severity={pace.severity}
          dayOfCycle={pace.dayOfCycle}
          cycleLength={pace.cycleLength}
          showStatus={false}
        />
      </section>

      <section aria-labelledby="ritm-level" className="flex flex-col gap-3">
        <h2 id="ritm-level" className="font-display text-lg font-semibold">
          {t("ritm.levels.label")}
        </h2>
        <FeatureSwitches
          values={{ headsUp: ritm.headsUp, speedBump: ritm.speedBump }}
          onChange={(feature, on) => feature !== "lock" && setFeature(feature, on)}
          lockLink={lockLink}
        />
      </section>

      <section aria-labelledby="ritm-setup" className="flex flex-col gap-2">
        <h2 id="ritm-setup" className="font-display text-lg font-semibold">
          {t("ritm.tab.setupTitle")}
        </h2>
        <dl className="divide-y divide-atlas-line rounded-2xl border border-atlas-line bg-white px-4">
          {ritm.goals.map((goal, i) => (
            <div key={i} className="flex min-h-14 items-center justify-between gap-4 py-3">
              <dt className="text-sm text-atlas-muted">{t(ritm.goals.length > 1 ? "ritm.goals.label" : "ritm.tab.goal", { n: i + 1 })}</dt>
              <dd className="text-right">
                <span className="block font-medium">
                  {goal.name} · <span className="tabular-nums">{formatLei(goal.amount, locale)}</span>
                </span>
                <span className="block text-sm text-atlas-muted tabular-nums">
                  {t("ritm.goals.plan", {
                    months: t(goal.months === 1 ? "ritm.goals.monthsOne" : "ritm.goals.months", { months: goal.months }),
                    amount: formatLei(goalMonthly(goal), locale),
                  })}
                </span>
              </dd>
            </div>
          ))}
          <div className="flex min-h-14 items-center justify-between gap-4 py-3">
            <dt className="text-sm text-atlas-muted">{t("ritm.goals.totalLabel")}</dt>
            <dd className="text-right font-medium tabular-nums">
              {t("ritm.goals.totalValue", {
                amount: formatLei(goals.totalMonthly, locale),
                pct: Math.round(goals.shareOfSalary * 100),
              })}
            </dd>
          </div>
          <div className="flex min-h-14 items-center justify-between gap-4 py-3">
            <dt className="text-sm text-atlas-muted">{t("ritm.tab.lock")}</dt>
            <dd className="text-right font-medium">
              {lock && lock.amount > 0 ? (
                <Link
                  href={locked ? "/ritm/lock" : "/ritm/unlock"}
                  className="inline-flex min-h-11 items-center rounded-lg text-ritm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ritm"
                >
                  {locked
                    ? t("ritm.tab.lockValue", { amount: formatLei(lock.amount, locale), day: lock.unlockDay })
                    : t("ritm.tab.lockOpen", { amount: formatLei(lock.amount, locale) })}
                </Link>
              ) : (
                t("ritm.tab.lockNone")
              )}
            </dd>
          </div>
          <div className="flex min-h-14 items-center justify-between gap-4 py-3">
            <dt className="text-sm text-atlas-muted">{t("ritm.tab.essentials")}</dt>
            <dd className="text-right font-medium tabular-nums">{formatLei(ritm.essentialsTotal, locale)}</dd>
          </div>
        </dl>
        <Link
          href="/ritm/goals"
          className="flex min-h-11 items-center self-start rounded-lg px-1 text-sm font-medium text-ritm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ritm"
        >
          {t("ritm.goals.editLink")}
        </Link>
        <Link
          href="/profile"
          className="flex min-h-11 items-center self-start rounded-lg px-1 text-sm font-medium text-ritm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ritm"
        >
          {t("ritm.tab.settingsLink")}
        </Link>
        <Link
          href="/ritm/summary"
          className="flex min-h-11 items-center self-start rounded-lg px-1 text-sm font-medium text-ritm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ritm"
        >
          {t("ritm.tab.summaryLink")}
        </Link>
      </section>
    </div>
  );
}
