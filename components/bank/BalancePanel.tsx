"use client";

import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";

/** Contour lines, like a topographic map. Decorative. */
function Contours() {
  return (
    <svg
      viewBox="0 0 220 180"
      className="pointer-events-none absolute -top-6 -right-10 h-[200px] w-[240px] text-white/[0.13]"
      fill="none"
      aria-hidden="true"
    >
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const s = 1 - i * 0.15;
        return (
          <path
            key={i}
            transform={`translate(${130 - 130 * s} ${92 - 92 * s}) scale(${s})`}
            d="M130 10c38 4 78 26 84 62 6 38-22 70-58 88-34 17-80 16-110-6C16 132 6 98 22 66 38 32 90 6 130 10Z"
            stroke="currentColor"
            strokeWidth={1.4 / s}
          />
        );
      })}
    </svg>
  );
}

export function BalancePanel({ balance, cardLast4 }: { balance: number; cardLast4: string }) {
  const t = useT();
  const locale = useLocale((s) => s.locale);

  return (
    <section
      aria-labelledby="current-account-label"
      className="relative overflow-hidden rounded-[28px] bg-atlas-ink px-6 pt-5 pb-6 text-white"
    >
      <Contours />
      <p id="current-account-label" className="relative text-sm text-white/75">
        {t("bank.home.balanceLabel")}
      </p>
      <p className="relative mt-2 font-display text-[2.6rem] leading-none font-semibold tracking-[-0.03em] tabular-nums">
        {formatLei(balance, locale)}
      </p>
      <p className="relative mt-5 text-sm text-white/75">{t("bank.home.card", { last4: cardLast4 })}</p>
    </section>
  );
}
