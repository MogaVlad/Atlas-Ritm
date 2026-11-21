"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useId } from "react";
import { Switch } from "@/components/bank/Switch";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { useBank } from "@/lib/store/useBank";
import { cn } from "@/lib/utils";

export type Feature = "headsUp" | "speedBump" | "lock";

/** The Lock row for the Ritm tab and Profile: on while money is locked, or chosen and waiting for payday. */
export function useLockLink(): { on: boolean; status: string } {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const lock = useBank((s) => s.lock);
  const planned = useBank((s) => (s.ritm.enabled ? s.ritm.lock : null));
  if (lock && lock.status !== "unlocked" && lock.amount > 0) {
    return { on: true, status: t("ritm.tab.lockValue", { amount: formatLei(lock.amount, locale), day: lock.unlockDay }) };
  }
  if (!lock && planned && planned.amount > 0) {
    return { on: true, status: t("ritm.features.lockPending", { amount: formatLei(planned.amount, locale) }) };
  }
  return { on: false, status: t("ritm.features.lockOff") };
}

/** i18n key of each feature under ritm.levels (name + description). */
const KEYS: Record<Feature, string> = { headsUp: "headsup", speedBump: "speedbump", lock: "lock" };

/**
 * What Ritm does, one switch per feature, each explained in one sentence. Any mix is allowed;
 * Heads-up starts on. The Lock switch shows only where it can be switched (onboarding): elsewhere
 * the Lock has its own screen because taking money out of it has rules.
 */
export function FeatureSwitches({
  values,
  onChange,
  lockLink,
}: {
  values: { headsUp: boolean; speedBump: boolean; lock?: boolean };
  onChange: (feature: Feature, on: boolean) => void;
  /** Outside onboarding: the Lock as a row that shows its state and opens the Lock screen. */
  lockLink?: { on: boolean; status: string };
}) {
  const t = useT();
  const baseId = useId();
  const features: Feature[] = values.lock === undefined ? ["headsUp", "speedBump"] : ["headsUp", "speedBump", "lock"];

  return (
    <ul className="divide-y divide-atlas-line rounded-2xl border border-atlas-line bg-white">
      {features.map((feature) => {
        const nameId = `${baseId}-${feature}-name`;
        const descId = `${baseId}-${feature}-desc`;
        return (
          <li key={feature} className="flex items-center gap-3 py-3 pr-2 pl-4">
            <div className="flex-1">
              <p id={nameId} className="font-medium">
                {t(`ritm.levels.${KEYS[feature]}.name`)}
              </p>
              <p id={descId} className="text-sm text-atlas-muted">
                {t(`ritm.levels.${KEYS[feature]}.description`)}
              </p>
            </div>
            <Switch
              checked={values[feature] ?? false}
              onChange={(on) => onChange(feature, on)}
              labelledBy={nameId}
              describedBy={descId}
            />
          </li>
        );
      })}
      {lockLink && (
        <li>
          <Link
            href="/ritm/lock"
            className="flex min-h-16 items-center gap-3 rounded-b-2xl py-3 pr-3 pl-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm"
          >
            <span className="flex-1">
              <span className="block font-medium">{t("ritm.levels.lock.name")}</span>
              <span className="block text-sm text-atlas-muted">{lockLink.status}</span>
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-sm font-medium",
                lockLink.on ? "bg-ritm text-white" : "bg-atlas-line text-atlas-ink",
              )}
            >
              {t(lockLink.on ? "ritm.features.on" : "ritm.features.off")}
            </span>
            <ChevronRight className="size-4 text-atlas-muted" aria-hidden="true" />
          </Link>
        </li>
      )}
    </ul>
  );
}
