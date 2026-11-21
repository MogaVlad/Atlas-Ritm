"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
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

/**
 * The current-account panel. With `href` the whole panel is a link (Home → account page);
 * `children` render under the card line (the account page puts the IBAN there).
 */
export function BalancePanel({
  balance,
  cardLast4,
  href,
  label,
  children,
}: {
  balance: number;
  cardLast4: string;
  href?: string;
  /** Defaults to "Cont curent". */
  label?: string;
  children?: ReactNode;
}) {
  const t = useT();
  const locale = useLocale((s) => s.locale);

  const body = (
    <>
      <Contours />
      <span className="relative flex items-center justify-between text-sm text-white/75">
        <span id="current-account-label">{label ?? t("bank.home.balanceLabel")}</span>
        {href && <ChevronRight className="size-5" aria-hidden="true" />}
      </span>
      <span className="relative mt-2 block font-display text-[2.6rem] leading-none font-semibold tracking-[-0.03em] tabular-nums">
        {formatLei(balance, locale)}
      </span>
      <span className="relative mt-5 block text-sm text-white/75">{t("bank.home.card", { last4: cardLast4 })}</span>
      {children && <div className="relative mt-4 border-t border-white/15 pt-4">{children}</div>}
    </>
  );

  const panel = "relative block overflow-hidden rounded-[28px] bg-atlas-ink px-6 pt-5 pb-6 text-white";
  return href ? (
    <Link
      href={href}
      className={`${panel} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine`}
    >
      {body}
    </Link>
  ) : (
    <section aria-labelledby="current-account-label" className={panel}>
      {body}
    </section>
  );
}
