"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState, type ReactNode } from "react";
import { PensionDoneDialog } from "@/components/ritm/PensionDoneDialog";
import { PensionExplainer } from "@/components/ritm/PensionExplainer";
import { RitmBack } from "@/components/ritm/RitmBack";
import { useHydrated } from "@/components/ritm/useHydrated";
import { PERSONA } from "@/lib/data/persona";
import { SAVINGS_OPTIONS, type SavingsOption } from "@/lib/data/savingsOptions";
import { pensionDeductibleLimit, pensionTaxBenefit } from "@/lib/engine";
import { formatLei } from "@/lib/format";
import { useHtmlLang, useLocale, useT } from "@/lib/i18n";
import { useFlash } from "@/lib/store/flash";
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
  const router = useRouter();
  const showFlash = useFlash((s) => s.show);

  // null = the default, keep 100%.
  const [keep, setKeep] = useState<number | null>(null);
  const [pensionOpen, setPensionOpen] = useState(false);
  const [pensioned, setPensioned] = useState<{ amount: number; taxSavedUpTo: number } | null>(null);
  /** The "Done" popup right after the pension contribution is confirmed. */
  const [doneOpen, setDoneOpen] = useState(false);
  // Next keeps this page alive while hidden: come back to the default.
  useLayoutEffect(
    () => () => {
      setKeep(null);
      setPensionOpen(false);
      setPensioned(null);
      setDoneOpen(false);
    },
    [],
  );

  if (!hydrated) return null;
  const lei = (n: number) => formatLei(n, locale);
  // All of the Lock may have gone to the pension, so every branch below shows the popup.
  const goHome = () => {
    const demo = new URLSearchParams(window.location.search).has("demo");
    router.replace(demo ? "/?demo=1" : "/");
  };
  // After the popup: if all of the Lock went to the pension there's nothing left to choose, so the screen closes.
  const closeDone = () => {
    setDoneOpen(false);
    const left = useBank.getState().lock;
    if (!left || left.amount <= 0) goHome();
  };
  const donePopup = doneOpen && pensioned && <PensionDoneDialog result={pensioned} onClose={closeDone} />;

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
        {donePopup}
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
  // The choice is made: close the screen and go Home, where the balances show it. Replace, so
  // Back doesn't reopen the choice.
  const confirm = () => {
    keepSaved(kept);
    showFlash(kept > 0 ? { key: "common.flash.saved", values: { amount: lei(kept) } } : { key: "common.flash.backToCurrent", values: { amount: lei(back) } });
    goHome();
  };

  return (
    <Screen>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[1.7rem] leading-tight font-semibold tracking-[-0.02em]">
          {t("ritm.unlock.title", { day: Math.min(day, lock.unlockDay) })}
        </h1>
        <p>{t("ritm.unlock.intro", { amount: lei(total) })}</p>
      </div>

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

      <section aria-labelledby="where" className="flex flex-col gap-3">
        <h2 id="where" className="font-display text-lg font-semibold">
          {t("ritm.unlock.compareTitle")}
        </h2>
        <p className="text-sm text-atlas-muted">{t("ritm.unlock.compareIntro")}</p>

        {featured && (
          <FeaturedPension
            option={featured}
            amount={total}
            pensioned={pensioned}
            onLearnMore={() => setPensionOpen(true)}
          />
        )}

        <h3 className="mt-3 text-sm font-medium text-atlas-muted">{t("ritm.unlock.others")}</h3>
        <ul className="flex flex-col divide-y divide-atlas-line rounded-2xl border border-atlas-line bg-white px-4">
          {others.map((o) => (
            <li key={o.id} className="flex flex-col gap-2 py-4">
              <h4 className="font-medium">{t(`ritm.unlock.options.${o.id}.name`)}</h4>
              <p className="text-sm leading-snug">{t(`ritm.unlock.options.${o.id}.tradeoff`)}</p>
              <dl className="flex flex-wrap gap-1.5 text-xs">
                <Chip label={t("ritm.unlock.access")} value={t(`ritm.unlock.accessValue.${o.access}`)} />
                <Chip label={t("ritm.unlock.risk")} value={t(`ritm.unlock.riskValue.${o.risk}`)} />
                <Chip label={t("ritm.unlock.horizon")} value={t(`ritm.unlock.horizonValue.${o.horizon}`)} />
              </dl>
              <p className="text-xs text-atlas-muted">{t(`ritm.unlock.options.${o.id}.note`)}</p>
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
            setDoneOpen(true);
          }}
        />
      )}
      {donePopup}
    </Screen>
  );
}

/** Pillar III is shown first and larger; the other two stay listed below (the comparison is the point). */
const featured = SAVINGS_OPTIONS.find((o) => o.needsExplainer);
const others = SAVINGS_OPTIONS.filter((o) => !o.needsExplainer);

/**
 * Pillar III, featured. The picture is the trade-off itself: a long line from today to retirement.
 * No return estimate anywhere; the tax figure comes from the engine. Nothing is pre-selected:
 * the button only opens the explainer (checkbox + explicit button).
 */
function FeaturedPension({
  option,
  amount,
  pensioned,
  onLearnMore,
}: {
  option: SavingsOption;
  amount: number;
  pensioned: { amount: number; taxSavedUpTo: number } | null;
  onLearnMore: () => void;
}) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const lei = (n: number) => formatLei(n, locale);
  const { taxSavedUpTo } = pensionTaxBenefit(amount);

  return (
    <article
      aria-labelledby="pillar3-title"
      className="relative overflow-hidden rounded-[28px] bg-ritm p-5 text-white shadow-[0_18px_40px_-18px_rgb(91_63_143/0.7)]"
    >
      <h3 id="pillar3-title" className="font-display text-xl leading-tight font-semibold">
        {t(`ritm.unlock.options.${option.id}.name`)}
      </h3>
      <p className="mt-1.5 leading-snug text-white/85">{t(`ritm.unlock.options.${option.id}.tradeoff`)}</p>

      {/* Today → retirement: how long the money stays, said with a line instead of a number. */}
      <div className="mt-6" aria-hidden="true">
        <div className="relative h-3">
          <span className="absolute top-1/2 right-1.5 left-1.5 h-px -translate-y-1/2 bg-[repeating-linear-gradient(90deg,rgb(255_255_255/0.75)_0_6px,transparent_6px_11px)]" />
          <span className="absolute top-1/2 left-0 size-3 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_4px_rgb(255_255_255/0.2)]" />
          <span className="absolute top-1/2 right-0 size-3 -translate-y-1/2 rounded-full border-2 border-white" />
        </div>
        <div className="mt-2 flex justify-between text-xs text-white/80">
          <span>{t("ritm.unlock.featured.today", { age: PERSONA.age })}</span>
          <span>{t("ritm.unlock.featured.retirement")}</span>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white/12 p-4">
        <p className="text-sm text-balance text-white/80">{t("ritm.unlock.featured.taxLabel", { amount: lei(amount) })}</p>
        <p className="mt-0.5 font-display text-[1.55rem] leading-tight font-semibold tabular-nums min-[380px]:text-[1.9rem]">
          {t("ritm.unlock.featured.taxValue", { tax: lei(taxSavedUpTo) })}
        </p>
        <p className="mt-1 text-xs leading-snug text-white/75">
          {t("ritm.unlock.featured.taxNote", { limit: lei(pensionDeductibleLimit()) })}
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
        {(
          [
            ["access", `accessValue.${option.access}`],
            ["risk", `riskValue.${option.risk}`],
            ["horizon", `horizonValue.${option.horizon}`],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5 rounded-xl bg-white/12 px-2.5 py-2">
            <dt className="text-xs text-white/75">{t(`ritm.unlock.${label}`)}</dt>
            <dd className="font-medium">{t(`ritm.unlock.${value}`)}</dd>
          </div>
        ))}
      </dl>

      {pensioned ? (
        <p role="status" className="mt-5 rounded-2xl bg-white p-4 text-sm font-medium text-ritm">
          {t("ritm.pension.done", { amount: lei(pensioned.amount), tax: lei(pensioned.taxSavedUpTo) })}
        </p>
      ) : (
        <button
          type="button"
          onClick={onLearnMore}
          className="mt-5 flex min-h-12 w-full items-center justify-center rounded-full bg-white px-5 font-medium text-ritm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {t("ritm.unlock.pensionCta")}
        </button>
      )}
      <p className="mt-3 text-xs leading-snug text-white/75">{t(`ritm.unlock.options.${option.id}.note`)}</p>
    </article>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1 rounded-full bg-atlas-paper px-2.5 py-1">
      <dt className="text-atlas-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Screen({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="flex items-center justify-between gap-4 px-5 pt-3">
        <RitmBack />
      </header>
      <main className="flex flex-1 flex-col gap-6 px-5 pt-4 pb-8">{children}</main>
    </>
  );
}

const PRIMARY =
  "flex min-h-12 items-center justify-center rounded-full bg-ritm px-5 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm";
