"use client";

import { ArrowDownLeft } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { useBank } from "@/lib/store/useBank";

/** The salary transaction of the current demo day, if payday is today. */
export function useSalaryToday() {
  return useBank((s) => s.transactions.find((t) => t.category === "salary" && t.day === s.demoDay));
}

/** Payday on Home: "Salariul a intrat, +4.800,00 lei". The one entrance animation on the screen. */
export function SalaryMoment() {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const reduce = useReducedMotion();
  const salary = useSalaryToday();
  if (!salary) return null;

  return (
    <motion.section
      aria-labelledby="salary-moment-title"
      initial={reduce ? false : { opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
      className="flex items-center gap-4 rounded-3xl bg-atlas-sea px-5 py-4"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-atlas-pine text-white" aria-hidden="true">
        <ArrowDownLeft className="size-6" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <h2 id="salary-moment-title" className="text-sm font-medium text-atlas-pine">
          {t("bank.salary.title")}
        </h2>
        <p className="font-display text-[1.7rem] leading-tight font-semibold tracking-[-0.02em] tabular-nums">
          +{formatLei(-salary.amount, locale)}
        </p>
        <p className="truncate text-sm text-atlas-muted">{t("bank.salary.from", { from: salary.merchant })}</p>
      </div>
    </motion.section>
  );
}
