"use client";

import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * The sentence under the number. 0 lei with money still left for the month means today's share
 * is used up, not that the month is in trouble: say that, or "0 lei" next to "you'll reach payday
 * comfortably" reads as a contradiction.
 */
export function safeLineKey(pace: { safeToSpendToday: number; remaining: number; severity: "ok" | "watch" | "spike" }): string {
  if (pace.safeToSpendToday <= 0 && pace.remaining > 0 && pace.severity === "ok") return "ritm.safe.usedToday";
  return `ritm.safe.line.${pace.severity}`;
}

type Props = {
  amount: number;
  /** One short sentence under the number, already translated. */
  line?: string;
  /** "inverse": white text for the cobalt panel on the Ritm tab. "hero": the bigger number. */
  tone?: "default" | "inverse";
  size?: "default" | "hero";
};

export function SafeToSpend({ amount, line, tone = "default", size = "default" }: Props) {
  const inverse = tone === "inverse";
  const t = useT();
  const locale = useLocale((s) => s.locale);
  // formatLei always ends in " RON"; split it so the unit can sit smaller next to the number.
  const number = formatLei(Math.max(amount, 0), locale).replace(/ RON$/, "");

  return (
    <section className="flex flex-col gap-1">
      <h2 className={cn("text-sm", inverse ? "text-white/85" : "text-atlas-muted")}>{t("ritm.safe.label")}</h2>
      <p className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-display leading-none font-bold tracking-[-0.03em] tabular-nums",
            size === "hero" ? "text-[3.75rem]" : "text-5xl",
          )}
        >
          {number}
        </span>
        <span className={cn("text-lg font-semibold", inverse ? "text-white/85" : "text-atlas-muted")}>RON</span>
      </p>
      {line && <p className={cn("mt-1 max-w-[32ch] text-[0.95rem] leading-snug", inverse && "text-white")}>{line}</p>}
    </section>
  );
}
