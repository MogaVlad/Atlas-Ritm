"use client";

import Link from "next/link";
import { useLayoutEffect, useState, type ReactNode } from "react";
import { LocaleToggle } from "@/components/bank/LocaleToggle";
import { PensionExplainer } from "@/components/ritm/PensionExplainer";
import { RitmBack } from "@/components/ritm/RitmBack";
import { useHydrated } from "@/components/ritm/useHydrated";
import { SAVINGS_OPTIONS } from "@/lib/data/savingsOptions";
import { formatLei } from "@/lib/format";
import { useHtmlLang, useLocale, useT } from "@/lib/i18n";
import { useBank } from "@/lib/store/useBank";

/** Unlock day: choose how much stays saved (default all of it), and see where kept money can go. */
export default function UnlockScreen() {
  useHtmlLang();
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const hydrated = useHydrated();
  const lock = useBank((s) => s.lock);
  const day = useBank((s) => s.demoDay);
  const keepSaved = useBank((s) => s.keepSaved);

  // null = the default, keep 100%.
  const [keep, setKeep] = useState<number | null>(null);
  const [done, setDone] = useState<{ keep: number; back: number } | null>(null);
  const [pensionOpen, setPensionOpen] = useState(false);
  const [pensioned, setPensioned] = useState<{ amount: number; taxSavedUpTo: number } | null>(null);
  // Next keeps this page alive while hidden: come back to the default.
  useLayoutEffect(
    () => () => {
      setKeep(null);
      setDone(null);
      setPensionOpen(false);
      setPensioned(null);
    },
    [],
  );

  if (!hydrated) return null;
  const lei = (n: number) => formatLei(n, locale);

  if (!lock || lock.amount <= 0) {
    return (
      <Screen>
        {pensioned ? (
          <p role="status" className="rounded-2xl bg-ritm-tint p-4">
            {t("ritm.pension.done", { amount: lei(pensioned.amount), tax: lei(pensioned.taxSavedUpTo) })}
          </p>
        ) : (
          <p className="text-atlas-muted">{t("ritm.unlock.empty")}</p>
        )}
      </Screen>
    );
  }

  if (lock.status !== "unlocked") {
    return (
      <Screen>
        <p>{t("ritm.unlock.notYet", { day: lock.unlockDay })}</p>
        <Link href="/ritm/lock" className={PRIMARY}>
          {t("ritm.unlock.notYetCta")}
        </Link>
      </Screen>
    );
  }

  const total = lock.amount;
  const kept = keep ?? total;
  const back = total - kept;
  const confirm = () => {
    keepSaved(kept);
    setDone({ keep: kept, back });
  };

  return (
    <Screen>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[1.7rem] leading-tight font-semibold tracking-[-0.02em]">
          {t("ritm.unlock.title", { day: Math.min(day, lock.unlockDay) })}
        </h1>
        {!done && <p>{t("ritm.unlock.intro", { amount: lei(total) })}</p>}
      </div>

      {done ? (
        <p role="status" className="rounded-2xl bg-ritm-tint p-4">
          {t("ritm.unlock.done", { keep: lei(done.keep), back: lei(done.back) })}
        </p>
      ) : (
        <section className="flex flex-col gap-4 rounded-3xl bg-white p-5 ring-1 ring-atlas-line">
          <label htmlFor="keep" className="text-sm font-medium">
            {t("ritm.unlock.keepLabel")}
          </label>
          <p className="font-display text-4xl leading-none font-semibold tabular-nums" aria-hidden="true">
            {lei(kept)}
          </p>
          <input
            id="keep"
            type="range"
            min={0}
            max={total}
            step={10}
            value={kept}
            aria-valuetext={t("ritm.unlock.keepValue", { keep: lei(kept), back: lei(back) })}
            onChange={(e) => setKeep(Number(e.target.value))}
            className="h-11 w-full accent-ritm"
          />
          <p className="text-sm text-atlas-muted">{t("ritm.unlock.keepValue", { keep: lei(kept), back: lei(back) })}</p>
          <button type="button" onClick={confirm} className={PRIMARY}>
            {kept > 0 ? t("ritm.unlock.confirmKeep", { amount: lei(kept) }) : t("ritm.unlock.confirmNone")}
          </button>
        </section>
      )}

      <section aria-labelledby="where" className="flex flex-col gap-3">
        <h2 id="where" className="font-display text-lg font-semibold">
          {t("ritm.unlock.compareTitle")}
        </h2>
        <p className="text-sm text-atlas-muted">{t("ritm.unlock.compareIntro")}</p>
        <ul className="flex flex-col gap-3">
          {SAVINGS_OPTIONS.map((o) => (
            <li key={o.id} className="flex flex-col gap-3 rounded-2xl border border-atlas-line bg-white p-4">
              <div className="flex flex-col gap-1">
                <h3 className="font-medium">{t(`ritm.unlock.options.${o.id}.name`)}</h3>
                <p className="text-sm">{t(`ritm.unlock.options.${o.id}.tradeoff`)}</p>
              </div>
              <dl className="grid grid-cols-3 gap-2 text-sm">
                <Fact label={t("ritm.unlock.access")} value={t(`ritm.unlock.accessValue.${o.access}`)} />
                <Fact label={t("ritm.unlock.risk")} value={t(`ritm.unlock.riskValue.${o.risk}`)} />
                <Fact label={t("ritm.unlock.horizon")} value={t(`ritm.unlock.horizonValue.${o.horizon}`)} />
              </dl>
              <p className="text-xs text-atlas-muted">{t(`ritm.unlock.options.${o.id}.note`)}</p>
              {o.needsExplainer &&
                (pensioned ? (
                  <p role="status" className="rounded-xl bg-ritm-tint p-3 text-sm">
                    {t("ritm.pension.done", { amount: lei(pensioned.amount), tax: lei(pensioned.taxSavedUpTo) })}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPensionOpen(true)}
                    className="min-h-11 self-start rounded-full border border-atlas-line px-4 text-sm font-medium text-ritm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm"
                  >
                    {t("ritm.unlock.pensionCta")}
                  </button>
                ))}
            </li>
          ))}
        </ul>
      </section>

      {pensionOpen && (
        <PensionExplainer
          amount={total}
          source="savings"
          onClose={() => setPensionOpen(false)}
          onDone={(result) => {
            setPensionOpen(false);
            setPensioned(result);
          }}
        />
      )}
    </Screen>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl bg-atlas-paper px-2 py-2">
      <dt className="text-xs text-atlas-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
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

const PRIMARY =
  "flex min-h-12 items-center justify-center rounded-full bg-ritm px-5 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm";
