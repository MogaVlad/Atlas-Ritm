"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LevelChips } from "@/components/ritm/LevelChips";
import { PaceBar } from "@/components/ritm/PaceBar";
import { SafeToSpend } from "@/components/ritm/SafeToSpend";
import { useHydrated } from "@/components/ritm/useHydrated";
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
  const setLevel = useBank((s) => s.setLevel);

  useEffect(() => {
    if (hydrated && !ritm.enabled) router.replace("/ritm/onboarding");
  }, [hydrated, ritm.enabled, router]);

  if (!hydrated || !ritm.enabled) return null;

  const locked = lock && lock.status !== "unlocked" && lock.amount > 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-[1.7rem] leading-tight font-semibold tracking-[-0.02em]">{t("ritm.tab.title")}</h1>

      {/* Not <RitmCard/>: Next keeps this page alive while hidden, and Home already has the card. */}
      <section className="flex flex-col gap-5 rounded-3xl bg-white p-5 ring-1 ring-atlas-line">
        <SafeToSpend amount={pace.safeToSpendToday} line={t(`ritm.safe.line.${pace.severity}`)} />
        <PaceBar
          pctSpent={pace.pctSpent}
          pctMonthPassed={pace.pctMonthPassed}
          severity={pace.severity}
          dayOfCycle={pace.dayOfCycle}
          cycleLength={pace.cycleLength}
        />
      </section>

      <section aria-labelledby="ritm-level" className="flex flex-col gap-3">
        <h2 id="ritm-level" className="font-display text-lg font-semibold">
          {t("ritm.levels.label")}
        </h2>
        <LevelChips value={ritm.level} onChange={setLevel} />
      </section>

      <section aria-labelledby="ritm-setup" className="flex flex-col gap-2">
        <h2 id="ritm-setup" className="font-display text-lg font-semibold">
          {t("ritm.tab.setupTitle")}
        </h2>
        <dl className="divide-y divide-atlas-line rounded-2xl border border-atlas-line bg-white px-4">
          <div className="flex min-h-14 items-center justify-between gap-4 py-3">
            <dt className="text-sm text-atlas-muted">{t("ritm.tab.goal")}</dt>
            <dd className="text-right font-medium">
              {ritm.goal.name} · <span className="tabular-nums">{formatLei(ritm.goal.amount, locale)}</span>
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
          href="/profile"
          className="flex min-h-11 items-center self-start rounded-lg px-1 text-sm font-medium text-ritm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ritm"
        >
          {t("ritm.tab.settingsLink")}
        </Link>
      </section>
    </div>
  );
}
