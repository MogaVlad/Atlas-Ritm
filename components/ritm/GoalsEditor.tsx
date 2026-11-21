"use client";

import { Minus, Plus, X } from "lucide-react";
import { useId } from "react";
import { DEMO_MONTH } from "@/components/bank/bankData";
import { goalMonthly, goalPlan, goalsPlan, RULES, type Goal } from "@/lib/engine";
import { cleanAmountInput, formatLei, parseAmount } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** A goal while it's being typed: the amount stays text so the field can be empty. */
export type GoalDraft = { name: string; amount: string; months: number };

export const toDraft = (goal: Goal): GoalDraft => ({ name: goal.name, amount: String(goal.amount), months: goal.months });
export const fromDraft = (draft: GoalDraft): Goal => ({ name: draft.name.trim(), amount: parseAmount(draft.amount), months: draft.months });

const INPUT =
  "min-h-11 w-full rounded-xl border border-atlas-line bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ritm";
/** The amount's − / + buttons move it by this many lei. */
const GOAL_STEP = 100;
const STEP_BUTTON =
  "flex size-11 shrink-0 items-center justify-center rounded-full border border-atlas-line bg-white text-ritm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm";

/**
 * One or more savings goals, each with the time to reach it. Shows what they ask for each month
 * together and, above the 20% savings guideline, explains why that may be hard to keep up.
 * It explains; it never blocks.
 */
export function GoalsEditor({
  goals,
  onChange,
  netSalary,
  invalid,
  monthlyLock = 0,
}: {
  goals: GoalDraft[];
  onChange: (goals: GoalDraft[]) => void;
  netSalary: number;
  invalid: boolean;
  /** The Lock put aside each payday. With one, the main goal shows whether it covers it, or the date it gets you there. */
  monthlyLock?: number;
}) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const baseId = useId();
  const lei = (amount: number) => formatLei(amount, locale);
  // "June 2028": the month a goal is reached, counted from the demo month.
  const monthYear = (months: number) =>
    new Intl.DateTimeFormat(locale === "ro" ? "ro-RO" : "en-GB", { month: "long", year: "numeric" }).format(
      new Date(DEMO_MONTH.getFullYear(), DEMO_MONTH.getMonth() + months, 1),
    );

  const parsed = goals.map(fromDraft);
  // Goals still being typed count as 0 lei, so the total never jumps to NaN.
  const plan = goalsPlan(
    parsed.map((g) => (g.amount > 0 ? g : { ...g, amount: 0 })),
    netSalary,
  );
  const months = (n: number) => t(n === 1 ? "ritm.goals.monthsOne" : "ritm.goals.months", { months: n });

  const update = (index: number, change: Partial<GoalDraft>) =>
    onChange(goals.map((g, i) => (i === index ? { ...g, ...change } : g)));

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold">{t("ritm.onboarding.s3.goalTitle")}</h2>

      <ol className="flex flex-col gap-3">
        {goals.map((goal, i) => {
          const id = `${baseId}-${i}`;
          const monthly = parsed[i].amount > 0 ? goalMonthly(parsed[i]) : null;
          return (
            <li key={i} className="flex flex-col gap-3 rounded-2xl border border-atlas-line bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-atlas-muted">{t("ritm.goals.label", { n: i + 1 })}</p>
                {goals.length > 1 && (
                  <button
                    type="button"
                    aria-label={t("ritm.goals.remove", { name: goal.name.trim() || t("ritm.goals.label", { n: i + 1 }) })}
                    onClick={() => onChange(goals.filter((_, j) => j !== i))}
                    className="-my-2 -mr-2 flex size-11 items-center justify-center rounded-full text-atlas-muted focus-visible:outline-2 focus-visible:outline-ritm"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${id}-name`} className="text-sm font-medium">
                  {t("ritm.onboarding.s3.goalName")}
                </label>
                <input id={`${id}-name`} value={goal.name} onChange={(e) => update(i, { name: e.target.value })} className={INPUT} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${id}-amount`} className="text-sm font-medium">
                  {t("ritm.onboarding.s3.goalAmount")}
                </label>
                {/* − / + move the amount by 100 lei; typing any amount still works. */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => update(i, { amount: String(Math.max(GOAL_STEP, (Math.ceil(parseAmount(goal.amount) / GOAL_STEP) || 1) * GOAL_STEP - GOAL_STEP)) })}
                    aria-label={t("ritm.onboarding.s3.goalMinus", { step: GOAL_STEP })}
                    className={STEP_BUTTON}
                  >
                    <Minus className="size-5" aria-hidden="true" />
                  </button>
                  <input
                    id={`${id}-amount`}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={goal.amount}
                    // No minus sign: a goal is never negative.
                    onChange={(e) => update(i, { amount: cleanAmountInput(e.target.value) })}
                    className={cn(INPUT, "min-w-0 flex-1 text-center tabular-nums")}
                  />
                  <button
                    type="button"
                    onClick={() => update(i, { amount: String((Math.floor(parseAmount(goal.amount) / GOAL_STEP) || 0) * GOAL_STEP + GOAL_STEP) })}
                    aria-label={t("ritm.onboarding.s3.goalPlus", { step: GOAL_STEP })}
                    className={STEP_BUTTON}
                  >
                    <Plus className="size-5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between">
                  <label htmlFor={`${id}-months`} className="text-sm font-medium">
                    {t("ritm.goals.reachIn")}
                  </label>
                  <span className="text-sm font-semibold tabular-nums">{months(goal.months)}</span>
                </div>
                <input
                  id={`${id}-months`}
                  type="range"
                  min={1}
                  max={RULES.goals.maxMonths}
                  value={goal.months}
                  onChange={(e) => update(i, { months: Number(e.target.value) })}
                  aria-valuetext={months(goal.months)}
                  className="h-11 w-full accent-ritm"
                />
                {monthly !== null && (
                  <p className="text-sm text-atlas-muted">{t("ritm.goals.monthly", { amount: lei(monthly) })}</p>
                )}
                {/* Section 11 A: with a Lock, the main goal says whether the Lock covers it, or when it gets there. */}
                {i === 0 && monthlyLock > 0 && parsed[0].amount > 0 && (() => {
                  const plan = goalPlan({ amount: parsed[0].amount, saved: 0, monthsLeft: parsed[0].months }, monthlyLock);
                  return (
                    <p className="rounded-xl bg-ritm-tint px-3 py-2 text-sm">
                      {plan.fitsLock
                        ? t("ritm.goals.lockCovers", { lock: lei(monthlyLock) })
                        : t("ritm.goals.lockReach", {
                            lock: lei(monthlyLock),
                            months: plan.monthsWithLock ?? 0,
                            date: monthYear(plan.monthsWithLock ?? 0),
                          })}
                    </p>
                  );
                })()}
              </div>
            </li>
          );
        })}
      </ol>

      {goals.length < RULES.goals.maxGoals && (
        <button
          type="button"
          onClick={() => onChange([...goals, { name: "", amount: "", months: 12 }])}
          className="flex min-h-11 items-center gap-2 self-start rounded-full px-1 font-medium text-ritm focus-visible:outline-2 focus-visible:outline-ritm"
        >
          <Plus className="size-4" aria-hidden />
          {t("ritm.goals.add")}
        </button>
      )}

      {invalid && (
        <p role="alert" className="text-sm text-ritm-spike">
          {t("ritm.onboarding.s3.goalInvalid")}
        </p>
      )}

      <div
        aria-live="polite"
        className={cn(
          "rounded-xl px-4 py-3 text-sm leading-relaxed",
          plan.overGuideline ? "bg-ritm-watch-tint" : "bg-ritm-tint",
        )}
      >
        <p className="font-semibold">
          {t("ritm.goals.total", { amount: lei(plan.totalMonthly), pct: Math.round(plan.shareOfSalary * 100) })}
        </p>
        <p className="mt-1">
          {plan.overGuideline
            ? t("ritm.goals.over", { guideline: lei(plan.guidelineMonthly) })
            : t("ritm.goals.within")}
        </p>
      </div>
    </section>
  );
}
