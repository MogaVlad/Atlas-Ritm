"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { LocaleToggle } from "@/components/bank/LocaleToggle";
import { LevelChips } from "@/components/ritm/LevelChips";
import { leaveRitm, RitmBack } from "@/components/ritm/RitmBack";
import { useBank } from "@/lib/store/useBank";
import { ESSENTIAL_CATEGORIES, NET_SALARY } from "@/lib/data/persona";
import { SCENARIO, transactionsUntil } from "@/lib/data/scenario";
import { computePace, RULES, type Category, type RitmLevel, type RitmSettings } from "@/lib/engine";
import { formatLei } from "@/lib/format";
import { useHtmlLang, useLocale, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const STEPS = 3;
/** Recurring essentials "detected" in Andrei's statement. */
const DETECTED = SCENARIO.filter((t) => ESSENTIAL_CATEGORIES.includes(t.category));
/** Lock slider: 0–30% of salary, in steps of 50 lei. */
const LOCK_MAX = Math.floor((NET_SALARY * 0.3) / 50) * 50;

// shortcut: the store has no place for future planned purchases yet; they show here but aren't saved. Ask Cosma for addPlannedPurchase.
type PlannedPurchase = { name: string; amount: number };

const INPUT =
  "min-h-11 w-full rounded-xl border border-atlas-line bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ritm";

export default function RitmOnboarding() {
  useHtmlLang();
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const router = useRouter();
  const defaults = useBank((s) => s.ritm);
  const enableRitm = useBank((s) => s.enableRitm);

  const [step, setStep] = useState(1);
  const [essentialOn, setEssentialOn] = useState<Partial<Record<Category, boolean>>>(() =>
    Object.fromEntries(DETECTED.map((tx) => [tx.category, defaults.essentialCategories.includes(tx.category)])),
  );
  const [planned, setPlanned] = useState<PlannedPurchase[]>([]);
  const [draft, setDraft] = useState<{ name: string; amount: string } | null>(null);
  const [draftError, setDraftError] = useState(false);
  const [level, setLevel] = useState<RitmLevel>(defaults.level);
  const [lockAmount, setLockAmount] = useState(defaults.lock.amount);
  const [unlockDay, setUnlockDay] = useState(defaults.lock.unlockDay);
  const [goalName, setGoalName] = useState(defaults.goal.name);
  const [goalAmount, setGoalAmount] = useState(String(defaults.goal.amount));
  const [goalError, setGoalError] = useState(false);

  // Move focus to the new step's heading so screen readers announce it (not on first load).
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    if (moved.current) heading.current?.focus();
  }, [step]);
  // Next keeps this page alive after we leave (finish, back, browser back): the next visit starts at step 1.
  useLayoutEffect(() => () => setStep(1), []);
  const go = (to: number) => {
    moved.current = true;
    setStep(to);
  };

  const essentials = DETECTED.filter((tx) => essentialOn[tx.category]);
  const settings: RitmSettings = {
    ...defaults,
    level,
    essentialCategories: essentials.map((tx) => tx.category),
    essentialsTotal: essentials.reduce((s, tx) => s + tx.amount, 0),
    goal: { name: goalName.trim(), amount: Number(goalAmount) },
    lock: { amount: lockAmount, unlockDay },
  };
  // The engine owns the "spending money" rule; we only show its result.
  const pool = computePace(transactionsUntil(1), settings, 1).pool;

  const addPlanned = () => {
    const amount = Number(draft?.amount);
    if (!draft?.name.trim() || !(amount > 0)) return setDraftError(true);
    setPlanned((p) => [...p, { name: draft.name.trim(), amount }]);
    setDraft(null);
    setDraftError(false);
  };

  const finish = () => {
    if (!settings.goal.name || !(settings.goal.amount > 0)) return setGoalError(true);
    enableRitm(settings);
    // Back where onboarding was opened from (Home, Payments, Profile...), not always Home.
    leaveRitm(router);
  };

  return (
    <>
      <header className="flex flex-col px-5 pt-3">
        <RitmBack />
        <div className="flex items-center justify-between gap-4 pt-2">
        <div className="flex flex-1 flex-col gap-2">
          <p className="text-sm text-atlas-muted">{t("ritm.onboarding.progress", { step, total: STEPS })}</p>
          <div aria-hidden className="flex gap-1.5">
            {Array.from({ length: STEPS }, (_, i) => (
              <span key={i} className={cn("h-1 flex-1 rounded-full", i < step ? "bg-ritm" : "bg-ritm-track")} />
            ))}
          </div>
        </div>
          <LocaleToggle />
        </div>
      </header>

      <main key={step} className="flex flex-1 flex-col gap-7 px-5 pt-8 pb-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
        <h1 ref={heading} tabIndex={-1} className="font-display text-[1.7rem] leading-tight font-semibold tracking-[-0.02em] outline-none">
          {t(`ritm.onboarding.s${step}.title`)}
        </h1>

        {step === 1 && (
          <>
            <section className="rounded-3xl bg-ritm px-5 py-6 text-white">
              <p className="text-sm text-white/80">{t("ritm.onboarding.s1.salaryLabel")}</p>
              <p className="mt-1 font-display text-4xl font-semibold tabular-nums">{formatLei(NET_SALARY, locale)}</p>
            </section>
            <ul className="flex flex-col gap-4">
              {(["l1", "l2", "l3"] as const).map((k) => (
                <li key={k} className="flex gap-3 text-[1.05rem] leading-snug">
                  <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-ritm" />
                  {t(`ritm.onboarding.s1.${k}`)}
                </li>
              ))}
            </ul>
          </>
        )}

        {step === 2 && (
          <>
            <section className="flex flex-col gap-3">
              <p className="text-atlas-muted">{t("ritm.onboarding.s2.intro")}</p>
              <ul className="divide-y divide-atlas-line rounded-2xl border border-atlas-line bg-white">
                {DETECTED.map((tx) => {
                  const name = t(`ritm.onboarding.s2.categories.${tx.category}`);
                  return (
                    <li key={tx.id} className="flex items-center gap-3 px-4 py-2">
                      <div className="flex-1">
                        <p className="font-medium">{name}</p>
                        <p className="text-sm text-atlas-muted">{tx.merchant}</p>
                      </div>
                      <p className="tabular-nums">{formatLei(tx.amount, locale)}</p>
                      <Switch
                        on={!!essentialOn[tx.category]}
                        label={name}
                        onToggle={() => setEssentialOn((s) => ({ ...s, [tx.category]: !s[tx.category] }))}
                      />
                    </li>
                  );
                })}
              </ul>
              <p className="flex justify-between text-sm">
                <span className="text-atlas-muted">{t("ritm.onboarding.s2.total")}</span>
                <span className="font-semibold tabular-nums">{formatLei(settings.essentialsTotal, locale)}</span>
              </p>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="font-display text-lg font-semibold">{t("ritm.onboarding.s2.plannedTitle")}</h2>
              <p className="text-sm text-atlas-muted">{t("ritm.onboarding.s2.plannedHint")}</p>
              {planned.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {planned.map((p, i) => (
                    <li key={i} className="flex items-center gap-3 rounded-xl bg-white px-4 py-1 ring-1 ring-atlas-line">
                      <span className="flex-1">{p.name}</span>
                      <span className="tabular-nums">{formatLei(p.amount, locale)}</span>
                      <button
                        type="button"
                        aria-label={t("ritm.onboarding.s2.plannedRemove", { name: p.name })}
                        onClick={() => setPlanned((list) => list.filter((_, j) => j !== i))}
                        className="-mr-2 flex size-11 items-center justify-center rounded-full text-atlas-muted focus-visible:outline-2 focus-visible:outline-ritm"
                      >
                        <X className="size-4" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {draft ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-atlas-line bg-white p-4">
                  <Field id="planned-name" label={t("ritm.onboarding.s2.plannedName")}>
                    <input
                      id="planned-name"
                      autoFocus
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      className={INPUT}
                    />
                  </Field>
                  <Field id="planned-amount" label={t("ritm.onboarding.s2.plannedAmount")}>
                    <input
                      id="planned-amount"
                      type="number"
                      inputMode="decimal"
                      min={1}
                      value={draft.amount}
                      onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                      className={INPUT}
                    />
                  </Field>
                  {draftError && (
                    <p role="alert" className="text-sm text-ritm-spike">
                      {t("ritm.onboarding.s2.plannedInvalid")}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button type="button" onClick={addPlanned} className={cn(PRIMARY, "flex-1")}>
                      {t("ritm.onboarding.s2.plannedSave")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDraft(null);
                        setDraftError(false);
                      }}
                      className={SECONDARY}
                    >
                      {t("ritm.onboarding.s2.plannedCancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setDraft({ name: "", amount: "" })}
                  className="flex min-h-11 items-center gap-2 self-start rounded-full px-1 font-medium text-ritm focus-visible:outline-2 focus-visible:outline-ritm"
                >
                  <Plus className="size-4" aria-hidden />
                  {t("ritm.onboarding.s2.plannedAdd")}
                </button>
              )}
            </section>
          </>
        )}

        {step === 3 && (
          <>
            <LevelChips value={level} onChange={setLevel} />

            <section className="flex flex-col gap-4">
              <h2 className="font-display text-lg font-semibold">{t("ritm.onboarding.s3.lockTitle")}</h2>
              <Field id="lock-amount" label={t("ritm.onboarding.s3.lockAmount")} value={formatLei(lockAmount, locale)}>
                <input
                  id="lock-amount"
                  type="range"
                  min={0}
                  max={LOCK_MAX}
                  step={50}
                  value={lockAmount}
                  onChange={(e) => setLockAmount(Number(e.target.value))}
                  aria-valuetext={formatLei(lockAmount, locale)}
                  className="h-11 w-full accent-ritm"
                />
              </Field>
              {lockAmount > 0 && (
                <Field id="unlock-day" label={t("ritm.onboarding.s3.lockDay")} value={t("ritm.onboarding.s3.dayValue", { day: unlockDay })}>
                  <input
                    id="unlock-day"
                    type="range"
                    min={2}
                    max={RULES.cycleLength - 1}
                    value={unlockDay}
                    onChange={(e) => setUnlockDay(Number(e.target.value))}
                    aria-valuetext={t("ritm.onboarding.s3.dayValue", { day: unlockDay })}
                    className="h-11 w-full accent-ritm"
                  />
                </Field>
              )}
              <p className="rounded-xl bg-ritm-tint px-4 py-3 text-sm leading-relaxed">
                {lockAmount > 0
                  ? t("ritm.onboarding.s3.lockExplain", { amount: formatLei(lockAmount, locale), day: unlockDay })
                  : t("ritm.onboarding.s3.lockNone")}
              </p>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="font-display text-lg font-semibold">{t("ritm.onboarding.s3.goalTitle")}</h2>
              <Field id="goal-name" label={t("ritm.onboarding.s3.goalName")}>
                <input id="goal-name" value={goalName} onChange={(e) => setGoalName(e.target.value)} className={INPUT} />
              </Field>
              <Field id="goal-amount" label={t("ritm.onboarding.s3.goalAmount")}>
                <input
                  id="goal-amount"
                  type="number"
                  inputMode="decimal"
                  min={1}
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  className={INPUT}
                />
              </Field>
              {goalError && (
                <p role="alert" className="text-sm text-ritm-spike">
                  {t("ritm.onboarding.s3.goalInvalid")}
                </p>
              )}
            </section>

            <section className="rounded-3xl border border-atlas-line bg-white px-5 py-4" aria-live="polite">
              <p className="text-sm text-atlas-muted">{t("ritm.onboarding.s3.pool")}</p>
              <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{formatLei(pool, locale)}</p>
              <p className="mt-1 text-sm text-atlas-muted">{t("ritm.onboarding.s3.poolHint")}</p>
            </section>
          </>
        )}
      </main>

      <footer className="sticky bottom-0 flex gap-3 border-t border-atlas-line bg-atlas-paper/95 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        {step > 1 && (
          <button type="button" onClick={() => go(step - 1)} className={SECONDARY}>
            {t("ritm.onboarding.back")}
          </button>
        )}
        <button type="button" onClick={step < STEPS ? () => go(step + 1) : finish} className={cn(PRIMARY, "flex-1")}>
          {t(step < STEPS ? "ritm.onboarding.next" : "ritm.onboarding.finish")}
        </button>
      </footer>
    </>
  );
}

const PRIMARY =
  "min-h-12 rounded-full bg-ritm px-5 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm";
const SECONDARY =
  "min-h-12 rounded-full border border-atlas-line bg-white px-5 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm";

function Field({ id, label, value, children }: { id: string; label: string; value?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {value && <span className="text-sm font-semibold tabular-nums">{value}</span>}
      </div>
      {children}
    </div>
  );
}

function Switch({ on, label, onToggle }: { on: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className="relative h-11 w-14 shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm"
    >
      <span className={cn("absolute inset-x-1 top-1/2 h-7 -translate-y-1/2 rounded-full transition-colors", on ? "bg-ritm" : "bg-atlas-line")} />
      <span
        className={cn(
          "absolute top-1/2 size-5 -translate-y-1/2 rounded-full bg-white shadow-sm motion-safe:transition-[left]",
          on ? "left-8" : "left-2",
        )}
      />
    </button>
  );
}
