"use client";

import { useT } from "@/lib/i18n";

export type RitmLevel = "headsup" | "speedbump" | "lock";
const LEVELS: RitmLevel[] = ["headsup", "speedbump", "lock"];

type Props = {
  value: RitmLevel;
  onChange: (level: RitmLevel) => void;
};

/** Levels get stricter left to right; the chosen one explains itself in one sentence. */
export function LevelChips({ value, onChange }: Props) {
  const t = useT();

  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label={t("ritm.levels.label")} className="flex flex-wrap gap-2">
        {LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={value === level}
            onClick={() => onChange(level)}
            className="min-h-11 rounded-full border border-border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm aria-checked:border-ritm aria-checked:bg-ritm aria-checked:text-white"
          >
            {t(`ritm.levels.${level}.name`)}
          </button>
        ))}
      </div>
      <p className="text-sm text-atlas-muted" aria-live="polite">
        {t(`ritm.levels.${value}.description`)}
      </p>
    </div>
  );
}
