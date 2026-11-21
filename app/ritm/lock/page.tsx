"use client";

import Link from "next/link";
import { useLayoutEffect, useState, type ReactNode } from "react";
import { LocaleToggle } from "@/components/bank/LocaleToggle";
import { RitmBack } from "@/components/ritm/RitmBack";
import { useHydrated } from "@/components/ritm/useHydrated";
import { interestEstimate, RULES } from "@/lib/engine";
import { formatLei } from "@/lib/format";
import { useHtmlLang, useLocale, useT } from "@/lib/i18n";
import { useBank } from "@/lib/store/useBank";

type Panel = "early" | "emergency" | null;

/** The Lock: how much, until when, what it earns, and the two ways out (24 h wait, or 300 lei now once a month). */
export default function LockScreen() {
  useHtmlLang();
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const hydrated = useHydrated();
  const lock = useBank((s) => s.lock);
  const day = useBank((s) => s.demoDay);
  const goal = useBank((s) => s.ritm.goal.name);
  const requestUnlock = useBank((s) => s.requestUnlock);
  const emergencyRelease = useBank((s) => s.emergencyRelease);

  const [panel, setPanel] = useState<Panel>(null);
  const [done, setDone] = useState<number | null>(null); // lei released by the emergency
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Next keeps this page alive while hidden: come back to a clean screen.
  useLayoutEffect(
    () => () => {
      setPanel(null);
      setDone(null);
      setAmount("");
      setReason("");
      setError(null);
    },
    [],
  );

  if (!hydrated) return null;
  const lei = (n: number) => formatLei(n, locale);

  if (!lock || lock.amount <= 0) {
    return (
      <Screen>
        <h1 className={H1}>{t("ritm.lock.title")}</h1>
        <p className="text-atlas-muted">{t("ritm.lock.empty")}</p>
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
  const open = (p: Panel) => {
    setPanel(p);
    setError(null);
    if (p === "emergency") setAmount(String(emergencyMax));
  };

  const takeOut = () => {
    const value = Number(amount);
    if (!(value > 0 && value <= emergencyMax)) return setError(t("ritm.lock.error.overLimit", { max: lei(emergencyMax) }));
    if (!reason.trim()) return setError(t("ritm.lock.error.reason"));
    const result = emergencyRelease(value);
    if (!result.ok) return setError(t(`ritm.lock.error.${result.reason}`, { max: lei(emergencyMax) }));
    setPanel(null);
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
      ) : (
        <section aria-labelledby="lock-ways-out" className="flex flex-col gap-3">
          <h2 id="lock-ways-out" className="font-display text-lg font-semibold">
            {t("ritm.lock.waysOut")}
          </h2>

          {panel === "early" ? (
            <Panel>
              <p>{t("ritm.lock.earlyExplain", { day: releaseDay, amount: lei(lock.amount), goal })}</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setPanel(null)} className={SECONDARY}>
                  {t("ritm.lock.cancel")}
                </button>
                <button type="button" onClick={requestUnlock} className={`${PRIMARY} flex-1`}>
                  {t("ritm.lock.earlyConfirm")}
                </button>
              </div>
            </Panel>
          ) : (
            <Option title={t("ritm.lock.earlyTitle")} hint={t("ritm.lock.earlyHint")} onClick={() => open("early")} />
          )}

          {lock.emergencyUsed ? (
            <p className="text-sm text-atlas-muted">{t("ritm.lock.emergencyUsed")}</p>
          ) : panel === "emergency" ? (
            <Panel>
              <p>{t("ritm.lock.emergencyExplain")}</p>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                {t("ritm.lock.emergencyAmount")}
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={emergencyMax}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={INPUT}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                {t("ritm.lock.emergencyReason")}
                <input type="text" maxLength={30} value={reason} onChange={(e) => setReason(e.target.value)} className={INPUT} />
              </label>
              {error && (
                <p role="alert" className="text-sm text-ritm-spike">
                  {error}
                </p>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setPanel(null)} className={SECONDARY}>
                  {t("ritm.lock.cancel")}
                </button>
                <button type="button" onClick={takeOut} className={`${PRIMARY} flex-1`}>
                  {t("ritm.lock.emergencyConfirm", { amount: lei(Number(amount) || 0) })}
                </button>
              </div>
            </Panel>
          ) : (
            <Option
              title={t("ritm.lock.emergencyTitle", { max: lei(emergencyMax) })}
              hint={t("ritm.lock.emergencyHint")}
              onClick={() => open("emergency")}
            />
          )}
        </section>
      )}
    </Screen>
  );
}

function Screen({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="flex items-center justify-between gap-4 px-5 pt-3">
        <RitmBack />
        <LocaleToggle />
      </div>
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

const H1 = "font-display text-[1.7rem] leading-tight font-semibold tracking-[-0.02em]";
const PRIMARY =
  "flex min-h-12 items-center justify-center rounded-full bg-ritm px-5 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm";
const SECONDARY =
  "min-h-12 rounded-full border border-atlas-line bg-white px-5 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm";
const INPUT =
  "min-h-11 w-full rounded-xl border border-atlas-line bg-white px-3 text-base font-normal focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ritm";
