"use client";

import Link from "next/link";
import { useLayoutEffect, useState, type ReactNode } from "react";
import { RitmBack } from "@/components/ritm/RitmBack";
import { useHydrated } from "@/components/ritm/useHydrated";
import { NET_SALARY } from "@/lib/data/persona";
import {
  interestEstimate,
  RULES,
  UNLOCK_REASONS,
  unlockMirror,
  type UnlockReason,
} from "@/lib/engine";
import { formatLei } from "@/lib/format";
import { useHtmlLang, useLocale, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useBank } from "@/lib/store/useBank";

/** Lock slider when setting one up here: up to 30% of the salary, in steps of 50 lei (same as onboarding). */
const LOCK_MAX = Math.floor((NET_SALARY * 0.3) / 50) * 50;

/** The Lock: how much, until when, what it earns, and the mirror (facts + your reason) before any unlock. */
export default function LockScreen() {
  useHtmlLang();
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const hydrated = useHydrated();
  const lock = useBank((s) => s.lock);
  const day = useBank((s) => s.demoDay);
  // The mirror talks about the main goal (the first one).
  const goal = useBank((s) => s.ritm.goals[0]);
  const ritm = useBank((s) => s.ritm);
  const saved = useBank((s) => s.savings);
  const current = useBank((s) => s.balances.current);
  const requestUnlock = useBank((s) => s.requestUnlock);
  const emergencyRelease = useBank((s) => s.emergencyRelease);
  const lockMoney = useBank((s) => s.lockMoney);
  const [setupAmount, setSetupAmount] = useState<number>(RULES.lock.defaultAmount);
  const [setupDay, setSetupDay] = useState<number>(RULES.lock.defaultUnlockDay);

  const [reason, setReason] = useState<UnlockReason | null>(null);
  // The reason and note are stored with the unlock (useBank.unlockReasons) for the month summary.
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [done, setDone] = useState<number | null>(null); // lei released by the emergency
  const [error, setError] = useState<string | null>(null);
  // Next keeps this page alive while hidden: come back to a clean screen.
  useLayoutEffect(
    () => () => {
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

  // Ritm is on with a Lock chosen, but the salary isn't in yet (day 0): it's taken on payday.
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
        <p role="status">
          {done !== null
            ? t("ritm.lock.emergencyDone", { amount: lei(done) })
            : t("ritm.lock.empty")}
        </p>
        {max < 50 || firstDay >= RULES.cycleLength - 1 ? (
          <p className="text-sm text-atlas-muted">{t("ritm.lock.setupNoMoney")}</p>
        ) : (
          <div className="flex flex-col gap-4 rounded-2xl border border-ritm/30 bg-white p-4">
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
          </div>
        )}
      </Screen>
    );
  }

  if (lock.status === "unlocked") {
    return (
      <Screen>
        <h1 className={H1}>{t("ritm.lock.title")}</h1>
        <p role="status">
          {t("ritm.lock.unlocked", { amount: lei(lock.amount) })}
        </p>
        <Link href="/ritm/unlock" className={PRIMARY}>
          {t("ritm.lock.chooseCta")}
        </Link>
      </Screen>
    );
  }

  const daysLeft = lock.unlockDay - day;
  const releaseDay =
    (lock.requestedAtDay ?? day) + RULES.lock.earlyUnlockDelayDays;
  const interest = interestEstimate(
    lock.amount,
    daysLeft,
    RULES.savings.annualRate,
  );
  const emergencyMax = Math.min(RULES.lock.emergencyMaxLei, lock.amount);
  const askAmount = reason !== null && reason !== "want" && !lock.emergencyUsed;
  const mirror = reason
    ? unlockMirror({
        lock,
        reason,
        amount: Number(amount) || 0,
        saved,
        goalAmount: goal?.amount ?? 0,
      })
    : null;
  const pct = (share: number) => Math.round(share * 100);

  const choose = (r: UnlockReason) => {
    setReason(r);
    setError(null);
    if (!amount) setAmount(String(emergencyMax));
  };

  const confirm = () => {
    if (!mirror || !reason) return;
    const why = note.trim() || undefined;
    if (mirror.route === "wait") return requestUnlock(reason, why);
    const result = emergencyRelease(mirror.released, reason, why);
    if (!result.ok)
      return setError(
        t(`ritm.lock.error.${result.reason}`, { max: lei(emergencyMax) }),
      );
    setReason(null);
    setDone(result.released);
  };

  return (
    <Screen>
      <h1 className={H1}>{t("ritm.lock.title")}</h1>

      <section className="flex flex-col gap-1 rounded-3xl bg-ritm p-5 text-white">
        <h2 className="text-sm text-white/80">{t("ritm.lock.amountLabel")}</h2>
        <p className="font-display text-5xl leading-none font-semibold tracking-tight tabular-nums">
          {lei(lock.amount)}
        </p>
        <p className="mt-2 text-sm">
          {daysLeft === 1
            ? t("ritm.lock.unlockTomorrow", { day: lock.unlockDay })
            : t("ritm.lock.unlockOn", { day: lock.unlockDay, days: daysLeft })}
        </p>
      </section>

      <div className="flex flex-col gap-1">
        <p>{t("ritm.lock.interest", { amount: lei(interest) })}</p>
        <p className="text-sm text-atlas-muted">
          {t("ritm.lock.interestNote", {
            rate: RULES.savings.annualRate * 100,
          })}
        </p>
      </div>

      {done !== null && (
        <p role="status" className="rounded-2xl bg-ritm-tint p-4">
          {t("ritm.lock.emergencyDone", { amount: lei(done) })}
        </p>
      )}

      {lock.status === "unlockRequested" ? (
        <p role="status" className="rounded-2xl bg-ritm-tint p-4">
          {t("ritm.lock.requested", {
            amount: lei(lock.amount),
            day: releaseDay,
          })}
        </p>
      ) : (
        <section
          aria-labelledby="lock-ways-out"
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <h2
              id="lock-ways-out"
              className="font-display text-lg font-semibold"
            >
              {t("ritm.lock.waysOut")}
            </h2>
            <p className="text-sm text-atlas-muted">
              {t("ritm.lock.mirrorIntro")}
            </p>
          </div>

          <div
            role="radiogroup"
            aria-labelledby="lock-reason"
            className="flex flex-col gap-2"
          >
            <p id="lock-reason" className="text-sm font-medium">
              {t("ritm.lock.reasonLabel")}
            </p>
            <div className="flex flex-wrap gap-2">
              {UNLOCK_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={reason === r}
                  onClick={() => choose(r)}
                  className={cn(
                    "min-h-11 rounded-full border border-atlas-line bg-white px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm",
                    reason === r && "border-ritm bg-ritm text-white",
                  )}
                >
                  {t(`ritm.lock.reason.${r}`)}
                </button>
              ))}
            </div>
          </div>

          {reason && mirror && (
            <div className="flex flex-col gap-4 rounded-2xl border border-ritm/30 bg-white p-4">
              {askAmount && (
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  {t("ritm.lock.emergencyAmount")}
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={lock.amount}
                    value={amount}
                    // No minus sign: a negative amount would put money in, not take it out.
                    onChange={(e) => setAmount(e.target.value.replace(/-/g, ""))}
                    onKeyDown={(e) => ["-", "+", "e", "E"].includes(e.key) && e.preventDefault()}
                    className={INPUT}
                  />
                </label>
              )}

              <p className="rounded-xl bg-ritm-tint p-3" aria-live="polite">
                {t("ritm.lock.mirror", {
                  amount: lei(mirror.released),
                  goal: goal?.name ?? "",
                  before: pct(mirror.goalBefore),
                  after: pct(mirror.goalAfter),
                })}{" "}
                {mirror.unlockNumber === 1
                  ? t("ritm.lock.firstUnlock")
                  : t("ritm.lock.nthUnlock", { n: mirror.unlockNumber })}
              </p>

              <p className="text-sm">
                {mirror.route === "emergency"
                  ? t("ritm.lock.routeNow")
                  : t(
                      reason === "want"
                        ? "ritm.lock.routeWant"
                        : lock.emergencyUsed
                          ? "ritm.lock.routeUsed"
                          : "ritm.lock.routeWait",
                      { day: releaseDay, max: lei(emergencyMax) },
                    )}
              </p>

              <label className="flex flex-col gap-1.5 text-sm font-medium">
                {t("ritm.lock.note")}
                <input
                  type="text"
                  maxLength={80}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={INPUT}
                />
              </label>

              {error && (
                <p role="alert" className="text-sm text-ritm-spike">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setReason(null)}
                  className={SECONDARY}
                >
                  {t("ritm.lock.cancel")}
                </button>
                <button
                  type="button"
                  onClick={confirm}
                  className={`${PRIMARY} flex-1`}
                >
                  {mirror.route === "emergency"
                    ? t("ritm.lock.emergencyConfirm", {
                        amount: lei(mirror.released),
                      })
                    : t("ritm.lock.earlyConfirm")}
                </button>
              </div>
            </div>
          )}
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
      </header>
      <main className="flex flex-1 flex-col gap-6 px-5 pt-4 pb-8">
        {children}
      </main>
    </>
  );
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

const H1 =
  "font-display text-[1.7rem] leading-tight font-semibold tracking-[-0.02em]";
const PRIMARY =
  "flex min-h-12 items-center justify-center rounded-full bg-ritm px-5 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm";
const SECONDARY =
  "min-h-12 rounded-full border border-atlas-line bg-white px-5 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm";
const INPUT =
  "min-h-11 w-full rounded-xl border border-atlas-line bg-white px-3 text-base font-normal focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ritm";
