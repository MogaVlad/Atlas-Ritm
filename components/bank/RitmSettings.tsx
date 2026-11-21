"use client";

import { Activity, CalendarClock } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { FeatureSwitches } from "@/components/ritm/FeatureSwitches";
import { ESSENTIAL_AMOUNTS } from "@/lib/data/persona";
import { ritmOffDay, type Category } from "@/lib/engine";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { useBank } from "@/lib/store/useBank";
import { CategoryIcon } from "./categories";
import { Switch } from "./Switch";

/** Speed bump thresholds offered in Settings (lei). 100 is the default from RULES. */
const THRESHOLDS = [50, 100, 200, 300] as const;
/** The essentials Ritm detected in Andrei's statement, in the order of the onboarding. */
const DETECTED = Object.keys(ESSENTIAL_AMOUNTS) as Category[];

const SECTION = "rounded-3xl bg-white p-5 ring-1 ring-atlas-line";

/** Ritm settings in Profile: on/off (with the 24 h rule), level, Speed bump threshold, essentials. */
export function RitmSettings() {
  const enabled = useBank((s) => s.ritm.enabled);
  return enabled ? <RitmOn /> : <RitmOff />;
}

function RitmOff() {
  const t = useT();
  return (
    <section aria-labelledby="ritm-off-title" className={SECTION}>
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ritm-tint text-ritm" aria-hidden="true">
          <Activity className="size-5" />
        </span>
        <h3 id="ritm-off-title" className="font-display text-lg font-semibold">
          {t("bank.profile.offTitle")}
        </h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-atlas-ink/80">{t("bank.profile.offBody")}</p>
      <Link
        href="/ritm/onboarding"
        className="mt-4 flex min-h-12 items-center justify-center rounded-full bg-ritm px-5 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm"
      >
        {t("bank.ritmInvite.cta")}
      </Link>
    </section>
  );
}

function RitmOn() {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const ids = { status: useId(), statusHint: useId(), threshold: useId(), essentials: useId() };

  const ritm = useBank((s) => s.ritm);
  const offDay = useBank((s) => s.ritmOffDay);
  const today = useBank((s) => s.demoDay);
  const lock = useBank((s) => s.lock);
  const pool = useBank((s) => s.pace.pool);
  const requestRitmOff = useBank((s) => s.requestRitmOff);
  const cancelRitmOff = useBank((s) => s.cancelRitmOff);
  const setFeature = useBank((s) => s.setFeature);
  const setThreshold = useBank((s) => s.setSpeedBumpThreshold);
  const setEssentials = useBank((s) => s.setEssentials);

  const [confirmingOff, setConfirmingOff] = useState(false);
  const lockHolds = lock !== null && lock.status !== "unlocked" && lock.amount > 0;

  const toggleEssential = (c: Category) =>
    setEssentials(
      ritm.essentialCategories.includes(c) ? ritm.essentialCategories.filter((x) => x !== c) : [...ritm.essentialCategories, c],
    );

  return (
    <div className="flex flex-col gap-4">
      {/* On / off, with the 24 h rule explained before anything happens */}
      <section className={SECTION}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id={ids.status} className="font-display text-lg font-semibold">
              {t("bank.profile.statusTitle")}
            </h3>
            <p id={ids.statusHint} className="mt-1 text-sm leading-relaxed text-atlas-muted">
              {offDay !== null ? t("bank.profile.offPending", { day: offDay }) : t("bank.profile.statusHint")}
            </p>
          </div>
          <Switch
            checked={offDay === null}
            labelledBy={ids.status}
            describedBy={ids.statusHint}
            onChange={(on) => {
              if (on) cancelRitmOff();
              else setConfirmingOff(true);
            }}
          />
        </div>

        {offDay !== null && (
          <button
            type="button"
            onClick={cancelRitmOff}
            className="mt-4 min-h-12 w-full rounded-full border border-atlas-line font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm"
          >
            {t("bank.profile.keepOn")}
          </button>
        )}

        {confirmingOff && offDay === null && (
          <div role="group" aria-labelledby="ritm-off-confirm" className="mt-4 rounded-2xl bg-atlas-paper p-4">
            <p id="ritm-off-confirm" className="flex items-center gap-2 font-medium">
              <CalendarClock className="size-5 text-ritm" aria-hidden="true" />
              {t("bank.profile.offConfirmTitle")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-atlas-ink/80">
              {t("bank.profile.offConfirmBody", { day: ritmOffDay(today) })}
              {lockHolds && <> {t("bank.profile.offConfirmLock", { amount: formatLei(lock.amount, locale), day: lock.unlockDay })}</>}
            </p>
            {/* The user asked to turn it off: that is the main button. Only the timing has friction. */}
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  requestRitmOff();
                  setConfirmingOff(false);
                }}
                className="min-h-12 rounded-full bg-atlas-ink font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm"
              >
                {t("bank.profile.offConfirmYes")}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingOff(false)}
                className="min-h-12 rounded-full border border-atlas-line bg-white font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm"
              >
                {t("bank.profile.offConfirmCancel")}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Level */}
      <section aria-labelledby="ritm-level-title" className={SECTION}>
        <h3 id="ritm-level-title" className="mb-3 font-display text-lg font-semibold">
          {t("bank.profile.levelTitle")}
        </h3>
        <FeatureSwitches
          values={{ headsUp: ritm.headsUp, speedBump: ritm.speedBump }}
          onChange={(feature, on) => feature !== "lock" && setFeature(feature, on)}
        />
      </section>

      {/* Speed bump threshold */}
      <section aria-labelledby={ids.threshold} className={SECTION}>
        <h3 id={ids.threshold} className="font-display text-lg font-semibold">
          {t("bank.profile.thresholdTitle")}
        </h3>
        <div role="radiogroup" aria-labelledby={ids.threshold} className="mt-3 grid grid-cols-2 gap-2">
          {THRESHOLDS.map((lei) => (
            <button
              key={lei}
              type="button"
              role="radio"
              aria-checked={ritm.speedBumpThreshold === lei}
              onClick={() => setThreshold(lei)}
              className="min-h-11 rounded-full border border-atlas-line px-4 text-sm font-medium tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm aria-checked:border-ritm aria-checked:bg-ritm aria-checked:text-white"
            >
              {formatLei(lei, locale)}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-atlas-muted">
          {t("bank.profile.thresholdHint", { amount: formatLei(ritm.speedBumpThreshold, locale) })}
        </p>
      </section>

      {/* Essentials */}
      <section aria-labelledby={ids.essentials} className={SECTION}>
        <h3 id={ids.essentials} className="font-display text-lg font-semibold">
          {t("bank.profile.essentialsTitle")}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-atlas-muted">{t("bank.profile.essentialsHint")}</p>
        <ul className="mt-3 divide-y divide-atlas-line">
          {DETECTED.map((c) => {
            const labelId = `essential-${c}`;
            const on = ritm.essentialCategories.includes(c);
            return (
              <li key={c} className="flex min-h-16 items-center gap-3 py-2">
                <CategoryIcon category={c} />
                <span className="min-w-0 flex-1">
                  <span id={labelId} className="block font-medium">
                    {t(`bank.categories.${c}`)}
                  </span>
                  <span className="block text-sm text-atlas-muted tabular-nums">
                    {t("bank.profile.perMonth", { amount: formatLei(ESSENTIAL_AMOUNTS[c] ?? 0, locale) })}
                  </span>
                </span>
                <Switch checked={on} labelledBy={labelId} onChange={() => toggleEssential(c)} />
              </li>
            );
          })}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-atlas-line pt-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-atlas-muted">{t("bank.profile.essentialsTotal")}</dt>
            <dd className="font-medium tabular-nums">{formatLei(ritm.essentialsTotal, locale)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-atlas-muted">{t("bank.profile.spendingMoney")}</dt>
            <dd className="font-medium tabular-nums">{formatLei(pool, locale)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
