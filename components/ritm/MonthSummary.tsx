"use client";

import type { Ref } from "react";
import { raiseSavingPlan, type PacePoint } from "@/lib/engine";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { useBank } from "@/lib/store/useBank";
import { useHydrated } from "./useHydrated";

/** Example raise for the commitment card (illustrative). */
const EXAMPLE_RAISE = 500;

/**
 * The month summary: what was left on payday, what's kept, the month's pace, and the raise
 * commitment. Shown on /ritm/summary and in <MonthSummaryDialog/> over Home.
 */
export function MonthSummary({ titleId, titleRef }: { titleId?: string; titleRef?: Ref<HTMLHeadingElement> }) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const hydrated = useHydrated();
  const summary = useBank((s) => s.summary);
  const commitment = useBank((s) => s.raiseCommitment);
  const setCommitment = useBank((s) => s.setRaiseCommitment);

  if (!hydrated) return null;
  const lei = (n: number) => formatLei(n, locale);
  const plan = raiseSavingPlan(EXAMPLE_RAISE);

  return (
    <div className="flex flex-col gap-6">
      <h1 id={titleId} ref={titleRef} tabIndex={titleRef ? -1 : undefined} className="font-display outline-none text-[1.7rem] leading-tight font-semibold tracking-[-0.02em]">
        {summary.reachedPayday ? t("ritm.summary.titlePayday") : t("ritm.summary.titleSoFar", { day: summary.day })}
      </h1>

      <section className="flex flex-col gap-1 rounded-3xl bg-ritm p-5 text-white">
        <h2 className="text-sm text-white/80">{t(summary.overspent > 0 ? "ritm.summary.overLabel" : "ritm.summary.leftLabel")}</h2>
        <p className="font-display text-5xl leading-none font-semibold tracking-tight tabular-nums">
          {lei(summary.overspent > 0 ? summary.overspent : summary.leftOfSpendingMoney)}
        </p>
        <p className="mt-2 text-sm">
          {summary.overspent > 0 ? t("ritm.summary.overLine") : t("ritm.summary.leftLine", { pool: lei(summary.pool) })}
        </p>
      </section>

      <dl className="divide-y divide-atlas-line rounded-2xl border border-atlas-line bg-white px-4">
        <Row label={t("ritm.summary.kept")} value={lei(summary.keptSaved)} />
        {summary.pensionTotal > 0 && <Row label={t("ritm.summary.pension")} value={lei(summary.pensionTotal)} />}
        <Row label={t("ritm.summary.spent")} value={lei(summary.spent)} />
      </dl>

      <section aria-labelledby="sum-pace" className="flex flex-col gap-3">
        <h2 id="sum-pace" className="font-display text-lg font-semibold">
          {t("ritm.summary.paceTitle")}
        </h2>
        <PaceLine
          points={summary.points}
          label={t("ritm.summary.paceAria", { ok: summary.daysOnPace, days: summary.points.length })}
        />
        <p className="text-sm">{t("ritm.summary.daysOnPace", { ok: summary.daysOnPace, days: summary.points.length })}</p>
        <ul className="flex gap-5 text-sm text-atlas-muted" aria-hidden="true">
          <li className="flex items-center gap-2">
            <span className="h-0.5 w-5 bg-ritm" />
            {t("ritm.summary.legendSpent")}
          </li>
          <li className="flex items-center gap-2">
            <span className="h-0 w-5 border-t-2 border-dashed border-atlas-muted" />
            {t("ritm.summary.legendMonth")}
          </li>
        </ul>
      </section>

      <section aria-labelledby="sum-raise" className="flex flex-col gap-3 rounded-3xl bg-white p-5 ring-1 ring-atlas-line">
        <div className="flex items-start justify-between gap-4">
          <h2 id="sum-raise" className="font-display text-lg leading-snug font-semibold">
            {t("ritm.summary.raiseTitle")}
          </h2>
          <button
            type="button"
            role="switch"
            aria-checked={commitment}
            aria-labelledby="sum-raise"
            onClick={() => setCommitment(!commitment)}
            className="flex min-h-11 min-w-14 shrink-0 items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm"
          >
            <span className={`flex h-7 w-12 items-center rounded-full p-0.5 transition-colors ${commitment ? "bg-ritm" : "bg-ritm-track"}`}>
              <span
                className={`size-6 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${commitment ? "translate-x-5" : ""}`}
              />
            </span>
          </button>
        </div>
        <p className="text-sm">
          {t("ritm.summary.raiseExample", { raise: lei(EXAMPLE_RAISE), saved: lei(plan.saved), kept: lei(plan.kept) })}
        </p>
        <p className="text-sm text-atlas-muted" role="status">
          {commitment ? t("ritm.summary.raiseOn") : t("ritm.summary.raiseOff")}
        </p>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 py-3">
      <dt className="text-sm text-atlas-muted">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}

/** Share of spending money used (solid) vs share of the month passed (dashed), day by day. */
function PaceLine({ points, label }: { points: PacePoint[]; label: string }) {
  const W = 300;
  const H = 120;
  const top = Math.max(1, ...points.map((p) => p.pctSpent));
  const x = (i: number) => (points.length > 1 ? (i / (points.length - 1)) * W : 0);
  const y = (pct: number) => H - (Math.min(pct, top) / top) * H;
  const path = (pick: (p: PacePoint) => number) => points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(pick(p)).toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="h-32 w-full overflow-visible" preserveAspectRatio="none">
      <path d={path((p) => p.pctMonthPassed)} fill="none" className="stroke-atlas-muted" strokeWidth={1.5} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
      <path d={path((p) => p.pctSpent)} fill="none" className="stroke-ritm" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
