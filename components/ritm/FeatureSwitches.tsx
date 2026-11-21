"use client";

import { useId } from "react";
import { Switch } from "@/components/bank/Switch";
import { useT } from "@/lib/i18n";

export type Feature = "headsUp" | "speedBump" | "lock";

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
}: {
  values: { headsUp: boolean; speedBump: boolean; lock?: boolean };
  onChange: (feature: Feature, on: boolean) => void;
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
    </ul>
  );
}
