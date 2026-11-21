"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef } from "react";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { useBank } from "./useBank";

/** Pages where the popup would get in the way. */
const HIDDEN_ON = ["/ritm/onboarding"];

const BUTTON =
  "min-h-12 rounded-full px-5 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm";

/**
 * Payday of month 2: Ritm starts again each month. Instead of sending the user straight to the
 * setup, this popup says so, shows last month's settings and lets them keep those or change them.
 * Rendered once in app/layout.tsx.
 */
export function MonthStartPrompt() {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const router = useRouter();
  const pathname = usePathname();
  const titleId = useId();
  const keepRef = useRef<HTMLButtonElement>(null);
  const show = useBank((s) => s.month === 2 && !s.ritm.enabled && !s.monthPromptSeen && !HIDDEN_ON.some((p) => pathname.startsWith(p)));
  const ritm = useBank((s) => s.ritm);
  const keep = useBank((s) => s.keepLastMonthSettings);
  const dismiss = useBank((s) => s.dismissMonthPrompt);

  useEffect(() => {
    if (show) keepRef.current?.focus();
  }, [show]);

  if (!show) return null;

  const lei = (n: number) => formatLei(n, locale);
  const lockOn = ritm.lock.amount > 0;
  const levels = [
    ritm.headsUp && t("ritm.levels.headsup.name"),
    ritm.speedBump && t("ritm.levels.speedbump.name"),
    lockOn && t("ritm.levels.lock.name"),
  ].filter(Boolean);
  const goal = ritm.goals[0];

  const change = () => {
    dismiss();
    router.push("/ritm/onboarding");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-atlas-ink/40 p-4 motion-safe:animate-in motion-safe:fade-in min-[500px]:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90dvh] w-full max-w-[358px] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-bottom-6 motion-safe:duration-300"
      >
        <h2 id={titleId} className="font-display text-2xl leading-tight font-semibold">
          {t("common.monthPrompt.title")}
        </h2>
        <p className="mt-2 leading-snug text-atlas-muted">{t("common.monthPrompt.body")}</p>

        <dl className="mt-4 divide-y divide-atlas-line rounded-2xl bg-atlas-paper px-4 text-sm">
          <Row label={t("common.monthPrompt.levels")} value={levels.length > 0 ? levels.join(", ") : t("common.monthPrompt.none")} />
          {lockOn && (
            <Row label={t("ritm.levels.lock.name")} value={t("common.monthPrompt.lockValue", { amount: lei(ritm.lock.amount), day: ritm.lock.unlockDay })} />
          )}
          {ritm.speedBump && <Row label={t("common.monthPrompt.threshold")} value={lei(ritm.speedBumpThreshold)} />}
          {goal && <Row label={t("common.monthPrompt.goal")} value={t("common.monthPrompt.goalValue", { name: goal.name, amount: lei(goal.amount) })} />}
          <Row label={t("common.monthPrompt.essentials")} value={t("common.monthPrompt.perMonth", { amount: lei(ritm.essentialsTotal) })} />
        </dl>

        {/* Keeping takes a Lock today: say what moves before the button that moves it. */}
        {lockOn && (
          <p className="mt-3 text-sm leading-snug text-atlas-muted">
            {t("common.monthPrompt.lockNote", { amount: lei(ritm.lock.amount), day: ritm.lock.unlockDay })}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-3">
          <button ref={keepRef} type="button" onClick={keep} className={`${BUTTON} bg-ritm text-white`}>
            {t("common.monthPrompt.keep")}
          </button>
          <button type="button" onClick={change} className={`${BUTTON} border border-atlas-line bg-white`}>
            {t("common.monthPrompt.change")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-atlas-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
