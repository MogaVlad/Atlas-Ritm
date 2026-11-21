"use client";

import Link from "next/link";
import { useLayoutEffect, useState, type ReactNode } from "react";
import { LocaleToggle } from "@/components/bank/LocaleToggle";
import { RitmBack } from "@/components/ritm/RitmBack";
import { useHydrated } from "@/components/ritm/useHydrated";
import { NET_SALARY } from "@/lib/data/persona";
import { interestEstimate, RULES } from "@/lib/engine";
import { formatLei } from "@/lib/format";
import { useHtmlLang, useLocale, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useBank, type UnlockReason } from "@/lib/store/useBank";

const REASONS: UnlockReason[] = ["health", "bill", "unexpected", "want"];
/** Lock slider: up to 30% of the salary, in steps of 50 lei (same as onboarding). */
const LOCK_MAX = Math.floor((NET_SALARY * 0.3) / 50) * 50;

/**
 * The Lock: how much, until when, what it earns, and the way out. Taking money out early works
 * like a mirror: the facts first (what it does to the goal, how often this month), then the user
 * says why. Health, a bill or something unexpected can use the instant release (up to 300 lei,
 * once a month); "Something I want" waits 24 hours. The money is never refused.
 */
export default function LockScreen() {
  useHtmlLang();
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const hydrated = useHydrated();
  const lock = useBank((s) => s.lock);
  const day = useBank((s) => s.demoDay);
  const ritm = useBank((s) => s.ritm);
  const savings = useBank((s) => s.balances.savings);
  const current = useBank((s) => s.balances.current);
  const exits = useBank((s) => s.unlockReasons.length);
  const requestUnlock = useBank((s) => s.requestUnlock);
  const emergencyRelease = useBank((s) => s.emergencyRelease);
  const lockMoney = useBank((s) => s.lockMoney);

  const [mirrorOpen, setMirrorOpen] = useState(false);
  const [reason, setReason] = useState<UnlockReason | null>(null);
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [done, setDone] = useState<number | null>(null); // lei released at once
  const [error, setError] = useState<string | null>(null);
  const [setupAmount, setSetupAmount] = useState<number>(RULES.lock.defaultAmount);
  const [setupDay, setSetupDay] = useState<number>(RULES.lock.defaultUnlockDay);
  // Next keeps this page alive while hidden: come back to a clean screen.
  useLayoutEffect(
    () => () => {
      setMirrorOpen(false);
      setReason(null);
      setNote("");
      setAmount("");
      setDone(null);
      setError(null);
    },
    [],
  );

  if (!hydrated) return null;
  const lei = (n: number) => formatLei(n, locale);
  const goal = ritm.goals[0];

  // Ritm is on with a Lock chosen, but the salary isn't in yet: it's taken on payday.
  if (!lock && ritm.enabled && ritm.lock.amount > 0 && day < 1) {
    return (
      <Screen>
        <h1 className={H1}>{t("ritm.lock.title")}</h1>
        <p role="status" className="rounded-2xl bg-ritm-tint p-4">
          {t("ritm.lock.pending", { amount: lei(ritm.lock.amount), day: ritm.lock.unlockDay })}
        </p>
      </Screen>
    );
  }

  if (!lock || lock.amount <= 0) {
    // Nothing locked: put money aside from here (never more than the current account holds).
    const max = Math.min(LOCK_MAX, Math.floor(Math.max(0, current) / 50) * 50);
    const value = Math.min(setupAmount, max);
    const firstDay = Math.min(RULES.cycleLength - 1, day + 1);
    const unlockDay = Math.max(setupDay, firstDay);
    return (
      <Screen>
        <h1 className={H1}>{t("ritm.lock.title")}</h1>
        <p className="text-atlas-muted">{t("ritm.lock.empty")}</p>
        {max < 50 || firstDay >= RULES.cycleLength - 1 ? (
          <p className="text-sm text-atlas-muted">{t("ritm.lock.setupNoMoney")}</p>
        ) : (
          <Panel>
            <h2 className="font-display text-lg font-semibold">{t("ritm.lock.setupTitle")}</h2>
            <Range
              label={t("ritm.onboarding.s3.lockAmount")}
              value={value}
              valueText={lei(value)}
              min={50}
              max={max}
              step={50}
              onChange={setSetupAmount}
            />
            <Range
              label={t("ritm.onboarding.s3.lockDay")}
              value={unlockDay}
              valueText={t("ritm.onboarding.s3.dayValue", { day: unlockDay })}
              min={firstDay}
              max={RULES.cycleLength - 1}
              step={1}
              onChange={setSetupDay}
            />
            <button type="button" onClick={() => lockMoney(value, unlockDay)} className={PRIMARY}>
              {t("ritm.lock.setupCta", { amount: lei(value), day: unlockDay })}
            </button>
          </Panel>
        )}
      </Screen>
    );
  }

  if (lock.status === "unlocked") {
    return (
      <Screen>
        <h1 className={H1}>{t("ritm.lock.title")}</h1>
        <p role="status">{done !== null ? t("ritm.lock.emergencyDone", { amount: lei(done) }) : t("ritm.lock.unlocked", { amount: lei(lock.amount) })}</p>
        <Link href="/ritm/unlock" className={PRIMARY}>
          {t("ritm.lock.chooseCta")}
        </Link>
      </Screen>
    );
  }

  const daysLeft = lock.unlockDay - day;
  const releaseDay = (lock.requestedAtDay ?? day) + RULES.lock.earlyUnlockDelayDays;
  const interest = interestEstimate(lock.amount, daysLeft, RULES.savings.annualRate);
  const emergencyMax = Math.min(RULES.lock.emergencyMaxLei, lock.amount);
  // Health, a bill or something unexpected get the money now, while the monthly release is unused.
  const instant = reason !== null && reason !== "want" && !lock.emergencyUsed;
  const taking = instant ? Number(amount) || 0 : lock.amount;
  const pct = (lei: number) => (goal && goal.amount > 0 ? Math.round((Math.max(0, lei) / goal.amount) * 100) : 0);

  const close = () => {
    setMirrorOpen(false);
    setReason(null);
    setNote("");
    setError(null);
  };

  const choose = (r: UnlockReason) => {
    setReason(r);
    setError(null);
    setAmount(String(emergencyMax));
  };

  const confirm = () => {
    if (!reason) return setError(t("ritm.lock.error.reason"));
    if (!instant) {
      requestUnlock(reason, note.trim() || undefined);
      return close();
    }
    const value = Number(amount);
    if (!(value > 0 && value <= emergencyMax)) return setError(t("ritm.lock.error.overLimit", { max: lei(emergencyMax) }));
    const result = emergencyRelease(value, reason, note.trim() || undefined);
    if (!result.ok) return setError(t(`ritm.lock.error.${result.reason}`, { max: lei(emergencyMax) }));
    close();
    setDone(result.released);
  };

  return (
    <Screen>
      <h1 className={H1}>{t("ritm.lock.title")}</h1>

      <section className="flex flex-col gap-1 rounded-3xl bg-ritm p-5 text-white">
        <h2 className="text-sm text-white/80">{t("ritm.lock.amountLabel")}</h2>
        <p className="font-display text-5xl leading-none font-semibold tracking-tight tabular-nums">{lei(lock.amount)}</p>
        <p className="mt-2 text-sm">
          {daysLeft === 1
            ? t("ritm.lock.unlockTomorrow", { day: lock.unlockDay })
            : t("ritm.lock.unlockOn", { day: lock.unlockDay, days: daysLeft })}
        </p>
      </section>

      <div className="flex flex-col gap-1">
        <p>{t("ritm.lock.interest", { amount: lei(interest) })}</p>
        <p className="text-sm text-atlas-muted">{t("ritm.lock.interestNote", { rate: RULES.savings.annualRate * 100 })}</p>
      </div>

      {done !== null && (
        <p role="status" className="rounded-2xl bg-ritm-tint p-4">
          {t("ritm.lock.emergencyDone", { amount: lei(done) })}
        </p>
      )}

      {lock.status === "unlockRequested" ? (
        <p role="status" className="rounded-2xl bg-ritm-tint p-4">
          {t("ritm.lock.requested", { amount: lei(lock.amount), day: releaseDay })}
        </p>
      ) : mirrorOpen ? (
        <Panel>
          <h2 className="font-display text-lg font-semibold">{t("ritm.lock.mirror.title")}</h2>

          {/* The mirror: facts, never blame. */}
          <ul className="flex flex-col gap-1.5 rounded-xl bg-atlas-paper p-3 text-sm" aria-live="polite">
            {goal && (
              <li>
                {t("ritm.lock.mirror.goal", { goal: goal.name, before: pct(savings), after: pct(savings - taking) })}
              </li>
            )}
            <li>{t("ritm.lock.mirror.count", { n: exits })}</li>
          </ul>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-medium">{t("ritm.lock.reasonTitle")}</legend>
            <div role="radiogroup" aria-label={t("ritm.lock.reasonTitle")} className="grid grid-cols-2 gap-2">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={reason === r}
                  onClick={() => choose(r)}
                  className="min-h-12 rounded-xl border border-atlas-line bg-white px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm aria-checked:border-ritm aria-checked:bg-ritm aria-checked:text-white"
                >
                  {t(`ritm.lock.reasons.${r}`)}
                </button>
              ))}
            </div>
          </fieldset>

          {reason && (
            <>
              <p className="text-sm">
                {instant
                  ? t("ritm.lock.outcomeNow", { max: lei(emergencyMax) })
                  : t(reason === "want" ? "ritm.lock.outcomeWant" : "ritm.lock.outcomeUsed", {
                      amount: lei(lock.amount),
                      day: releaseDay,
                    })}
              </p>
              {instant && (
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  {t("ritm.lock.emergencyAmount")}
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={emergencyMax}
                    value={amount}
                    // No minus sign: a negative amount would put money in, not take it out.
                    onChange={(e) => setAmount(e.target.value.replace(/-/g, ""))}
                    onKeyDown={(e) => ["-", "+", "e", "E"].includes(e.key) && e.preventDefault()}
                    className={INPUT}
                  />
                </label>
              )}
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                {t("ritm.lock.noteLabel")}
                <input type="text" maxLength={60} value={note} onChange={(e) => setNote(e.target.value)} className={INPUT} />
              </label>
            </>
          )}

          {error && (
            <p role="alert" className="text-sm text-ritm-spike">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={close} className={SECONDARY}>
              {t("ritm.lock.cancel")}
            </button>
            <button type="button" onClick={confirm} disabled={!reason} className={cn(PRIMARY, "flex-1 disabled:opacity-40")}>
              {instant ? t("ritm.lock.emergencyConfirm", { amount: lei(Number(amount) || 0) }) : t("ritm.lock.earlyConfirm")}
            </button>
          </div>
        </Panel>
      ) : (
        <section aria-labelledby="lock-ways-out" className="flex flex-col gap-3">
          <h2 id="lock-ways-out" className="font-display text-lg font-semibold">
            {t("ritm.lock.waysOut")}
          </h2>
          <Option title={t("ritm.lock.takeOutTitle")} hint={t("ritm.lock.takeOutHint")} onClick={() => setMirrorOpen(true)} />
          {lock.emergencyUsed && <p className="text-sm text-atlas-muted">{t("ritm.lock.emergencyUsed")}</p>}
        </section>
      )}
    </Screen>
  );
}

function Screen({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="flex items-center justify-between gap-4 px-5 pt-3">
        <RitmBack />
        <LocaleToggle />
      </header>
      <main className="flex flex-1 flex-col gap-6 px-5 pt-4 pb-8">{children}</main>
    </>
  );
}

function Option({ title, hint, onClick }: { title: string; hint: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-16 flex-col items-start gap-0.5 rounded-2xl border border-atlas-line bg-white px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm"
    >
      <span className="font-medium text-ritm">{title}</span>
      <span className="text-sm text-atlas-muted">{hint}</span>
    </button>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4 rounded-2xl border border-ritm/30 bg-white p-4">{children}</div>;
}

function Range({
  label,
  value,
  valueText,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  valueText: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      <span className="flex items-baseline justify-between">
        {label}
        <span className="font-semibold tabular-nums">{valueText}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={valueText}
        className="h-11 w-full accent-ritm"
      />
    </label>
  );
}

const H1 = "font-display text-[1.7rem] leading-tight font-semibold tracking-[-0.02em]";
const PRIMARY =
  "flex min-h-12 items-center justify-center rounded-full bg-ritm px-5 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm";
const SECONDARY =
  "min-h-12 rounded-full border border-atlas-line bg-white px-5 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm";
const INPUT =
  "min-h-11 w-full rounded-xl border border-atlas-line bg-white px-3 text-base font-normal focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ritm";
