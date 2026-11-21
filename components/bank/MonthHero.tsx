"use client";

import { ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { PERSONA } from "@/lib/data/persona";
import { RULES } from "@/lib/engine";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { CARD_LAST4, useBalances, useDemoDay } from "./bankData";
import { formatDayLong, formatDayShort } from "./dates";
import { useSalaryToday } from "./SalaryMoment";

/** "24 de zile până la salariu": Romanian puts "de" before numbers from 20 up. */
function daysToPaydayKey(day: number, total: number): { key: string; n: number } {
  if (day <= 0) return { key: "bank.hero.paydayTomorrow", n: 1 };
  if (day >= total) return { key: "bank.hero.paydayToday", n: 0 };
  const n = total - day;
  if (n === 1) return { key: "bank.hero.paydayTomorrow", n };
  return { key: n >= 20 ? "bank.hero.daysMany" : "bank.hero.daysFew", n };
}

/**
 * Home's header: the balance, and the month drawn as a route from payday to payday with the
 * brass "you are here" pin from the Atlas mark on today. One glance says what the app is about.
 */
export function MonthHero() {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const reduce = useReducedMotion();
  const day = useDemoDay();
  const balances = useBalances();
  const salary = useSalaryToday();

  const total = RULES.cycleLength;
  // Day 1 (payday) sits at the start of the route, day 30 (payday again) at the end; day 0 waits at the start.
  const pos = Math.min(1, Math.max(0, (day - 1) / (total - 1)));
  const { key, n } = daysToPaydayKey(day, total);
  // Keep the "today" label inside the route at both ends.
  const labelAlign = pos < 0.12 ? "translate-x-0" : pos > 0.88 ? "-translate-x-full" : "-translate-x-1/2";
  const lei = (v: number) => formatLei(v, locale);

  return (
    <section aria-labelledby="home-greeting" className="-mx-5 -mt-5 rounded-b-[32px] bg-atlas-ink px-5 pt-1 pb-20 text-white">
      <h1 id="home-greeting" className="font-display text-[1.6rem] leading-tight font-semibold tracking-[-0.02em]">
        {t("bank.home.greeting", { name: PERSONA.name })}
      </h1>
      <p className="mt-0.5 text-sm text-white/70">{formatDayLong(Math.max(day, 0), locale)}</p>

      <Link
        href="/accounts/current"
        className="group mt-6 block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        <span className="flex items-center gap-1 text-sm text-white/70">
          {t("bank.hero.balanceLabel")}
          <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
        </span>
        <span className="mt-1 block font-display text-[2.35rem] leading-none font-semibold tracking-[-0.035em] tabular-nums min-[380px]:text-[2.9rem]">
          {lei(balances.current)}
        </span>
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/70">
        <span>{t("bank.home.card", { last4: CARD_LAST4 })}</span>
        <Link
          href="/accounts/savings"
          className="flex min-h-11 items-center rounded-lg text-white underline decoration-white/30 underline-offset-4 hover:decoration-white focus-visible:outline-2 focus-visible:outline-white"
        >
          {t("bank.hero.savings", { amount: lei(balances.savings) })}
        </Link>
      </div>

      {salary && (
        <p className="mt-3 rounded-2xl bg-white/10 px-4 py-3 text-sm leading-snug">
          {t("bank.hero.salaryIn", { amount: lei(-salary.amount), from: salary.merchant })}
        </p>
      )}

      {/* The month as a route: solid where it's been, dashed where it's going, the pin on today. */}
      <div className="mt-9" aria-hidden="true">
        <div className="relative h-4">
          <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-[repeating-linear-gradient(90deg,rgb(255_255_255/0.4)_0_6px,transparent_6px_11px)]" />
          <motion.span
            className="absolute top-1/2 left-0 h-0.5 origin-left -translate-y-1/2 bg-white"
            style={{ width: `${pos * 100}%` }}
            initial={reduce ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          />
          <span className="absolute top-1/2 left-0 size-2.5 -translate-y-1/2 rounded-full bg-white" />
          <span className="absolute top-1/2 right-0 size-3 -translate-y-1/2 rounded-full border-2 border-white bg-atlas-ink" />
          <motion.span
            className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-atlas-brass-light ring-4 ring-atlas-brass-light/25"
            style={{ left: `${pos * 100}%` }}
            initial={reduce ? false : { left: "0%" }}
            animate={{ left: `${pos * 100}%` }}
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          />
          <span
            className={`absolute -top-6 text-xs font-medium whitespace-nowrap text-atlas-brass-light ${labelAlign}`}
            style={{ left: `${pos * 100}%` }}
          >
            {day <= 0 ? t("bank.hero.beforePayday") : t("bank.hero.dayOf", { day, total })}
          </span>
        </div>
        <div className="mt-2 flex justify-between text-xs text-white/60">
          <span>{formatDayShort(1, locale)}</span>
          <span>{formatDayShort(total, locale)}</span>
        </div>
      </div>

      <p className="mt-4 font-display text-xl font-semibold">{t(key, { n })}</p>
    </section>
  );
}
