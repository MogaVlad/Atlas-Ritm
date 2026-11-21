"use client";

import { Wallet } from "lucide-react";
import { NET_SALARY } from "@/lib/data/persona";
import { interestEstimate, pensionTaxBenefit, RULES } from "@/lib/engine";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { useBank } from "@/lib/store/useBank";
import type { MoneyCard as Kind } from "./content";

/** Yearly Pillar III example: 100 RON a month. */
const PENSION_EXAMPLE = 1200;
/** Below this, the interest card uses an example amount instead of the real savings. */
const INTEREST_MIN = 100;
const INTEREST_EXAMPLE = 1000;

/**
 * "On your money": the lesson's idea computed on the person's own Atlas numbers. Rules (interest,
 * tax, the Pillar III deduction) come from lib/engine; this only does the lesson's arithmetic.
 */
export function MoneyCard({ lessonId, kind }: { lessonId: string; kind: Kind }) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const essentials = useBank((s) => s.ritm.essentialsTotal);
  const savings = useBank((s) => s.balances.savings);
  const lei = (n: number) => formatLei(n, locale);

  let key = `bank.learn.lessons.${lessonId}.money`;
  let values: Record<string, string | number> = {};
  switch (kind) {
    case "net":
      values = { net: lei(NET_SALARY) };
      break;
    case "fixed":
      values = { essentials: lei(essentials), rest: lei(NET_SALARY - essentials) };
      break;
    case "rule":
      values = {
        net: lei(NET_SALARY),
        n50: lei(NET_SALARY * 0.5),
        n30: lei(NET_SALARY * 0.3),
        n20: lei(NET_SALARY * 0.2),
        essentials: lei(essentials),
        pct: Math.round((essentials / NET_SALARY) * 100),
      };
      break;
    case "emergency":
      values = { e3: lei(essentials * 3), savings: lei(savings) };
      break;
    case "interest": {
      const have = savings >= INTEREST_MIN;
      const amount = have ? savings : INTEREST_EXAMPLE;
      key = `bank.learn.lessons.${lessonId}.${have ? "moneyHave" : "moneyIf"}`;
      values = {
        amount: lei(amount),
        rate: Math.round(RULES.savings.annualRate * 1000) / 10,
        interest: lei(interestEstimate(amount, 365, RULES.savings.annualRate)),
      };
      break;
    }
    case "pension":
      values = { amount: lei(PENSION_EXAMPLE), tax: lei(pensionTaxBenefit(PENSION_EXAMPLE).taxSavedUpTo) };
      break;
  }

  return (
    <div className="rounded-3xl bg-atlas-ink p-5 text-white">
      <p className="flex items-center gap-2 text-sm font-medium text-atlas-brass-light">
        <Wallet className="size-4" aria-hidden="true" />
        {t("bank.learn.lesson.yourMoney")}
      </p>
      <p className="mt-3 text-lg leading-snug text-pretty">{t(key, values)}</p>
    </div>
  );
}
