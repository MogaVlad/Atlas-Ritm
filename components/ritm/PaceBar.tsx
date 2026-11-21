"use client";

import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type PaceSeverity = "ok" | "watch" | "spike";

const FILL: Record<PaceSeverity, string> = {
  ok: "bg-ritm",
  watch: "bg-ritm-watch",
  spike: "bg-ritm-spike",
};
const TEXT: Record<PaceSeverity, string> = {
  ok: "text-ritm bg-ritm-tint",
  watch: "text-ritm-watch bg-ritm-watch-tint",
  spike: "text-ritm-spike bg-ritm-spike-tint",
};

type Props = {
  /** Share of spending money used, 0–1. */
  pctSpent: number;
  /** Share of the month passed, 0–1. */
  pctMonthPassed: number;
  severity: PaceSeverity;
  dayOfCycle: number;
  cycleLength: number;
};

const pct = (x: number) => Math.round(Math.min(Math.max(x, 0), 1) * 100);

/**
 * One bar = this month's spending money. Solid fill = spent within the month's pace;
 * hatched fill = spent ahead of the calendar. The dark tick is today.
 */
export function PaceBar({ pctSpent, pctMonthPassed, severity, dayOfCycle, cycleLength }: Props) {
  const t = useT();
  const spent = pct(pctSpent);
  const month = pct(pctMonthPassed);
  const onPace = Math.min(spent, month);
  const ahead = Math.max(spent - month, 0);

  return (
    <figure className="flex flex-col gap-3">
      <div
        role="img"
        aria-label={t("ritm.pace.aria", { spent, month, status: t(`ritm.pace.status.${severity}`) })}
        className="relative h-3 rounded-full bg-ritm-track"
      >
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <div
            className={cn("absolute inset-y-0 left-0 motion-safe:transition-[width] motion-safe:duration-500", FILL[severity])}
            style={{ width: `${onPace}%` }}
          />
          {ahead > 0 && (
            <div
              className={cn("absolute inset-y-0 motion-safe:transition-[left,width] motion-safe:duration-500", FILL[severity])}
              style={{
                left: `${month}%`,
                width: `${ahead}%`,
                maskImage: "repeating-linear-gradient(135deg, #000 0 3px, transparent 3px 6px)",
              }}
            />
          )}
        </div>
        <div
          aria-hidden
          className="absolute -top-1.5 h-6 w-0.5 -translate-x-1/2 rounded-full bg-foreground"
          style={{ left: `${month}%` }}
        />
      </div>

      <figcaption className="flex items-start justify-between gap-4 text-sm">
        <span>
          <span className="font-semibold tabular-nums">{spent}%</span>{" "}
          <span className="text-atlas-muted">{t("ritm.pace.spent")}</span>
        </span>
        <span className="text-right">
          <span className="text-atlas-muted">{t("ritm.pace.today", { day: dayOfCycle, total: cycleLength })}</span>{" "}
          <span className="font-semibold tabular-nums">{month}%</span>
        </span>
      </figcaption>

      <p className={cn("self-start rounded-full px-3 py-1 text-sm font-medium", TEXT[severity])}>
        {t(`ritm.pace.status.${severity}`)}
      </p>
    </figure>
  );
}
