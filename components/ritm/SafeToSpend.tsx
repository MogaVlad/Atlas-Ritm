"use client";

import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";

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
};

export function SafeToSpend({ amount, line }: Props) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  // formatLei always ends in " lei"; split it so the unit can sit smaller next to the number.
  const number = formatLei(Math.max(amount, 0), locale).replace(/ lei$/, "");

  return (
    <section className="flex flex-col gap-1">
      <h2 className="text-sm text-atlas-muted">{t("ritm.safe.label")}</h2>
      <p className="flex items-baseline gap-1.5">
        <span className="text-5xl font-semibold leading-none tracking-tight tabular-nums">{number}</span>
        <span className="text-lg font-medium text-atlas-muted">lei</span>
      </p>
      {line && <p className="mt-1 max-w-[30ch] text-sm">{line}</p>}
    </section>
  );
}
