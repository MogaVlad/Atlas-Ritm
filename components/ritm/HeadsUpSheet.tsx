"use client";

import { Check, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { isCounted, RULES, type AlertAction } from "@/lib/engine";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { useBank, type HeadsUpNotification } from "@/lib/store/useBank";
import { cn } from "@/lib/utils";

type Props = {
  /** A snapshot: the sheet keeps showing its confirmation after the store drops the notification. */
  notification: HeadsUpNotification;
  onClose: () => void;
};

const TAG = { ok: "", watch: "bg-ritm-watch-tint text-ritm-watch", spike: "bg-ritm-spike-tint text-ritm-spike" } as const;

/** Bottom sheet over the phone: why Ritm spoke up, and three one-tap answers. */
export function HeadsUpSheet({ notification, onClose }: Props) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const titleId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const [done, setDone] = useState<string | null>(null);
  /** "Some payments were planned": the list of this month's payments to pick from. */
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);

  const ritm = useBank((s) => s.ritm);
  const lock = useBank((s) => s.lock);
  const demoDay = useBank((s) => s.demoDay);
  const transactions = useBank((s) => s.transactions);
  const lockMoney = useBank((s) => s.lockMoney);
  const setFeature = useBank((s) => s.setFeature);
  const markPlanned = useBank((s) => s.markPlanned);
  const dismiss = useBank((s) => s.dismissNotification);

  useEffect(() => heading.current?.focus(), []);

  // "Mark as planned": the user picks one or more of this month's purchases that still count (biggest first).
  const candidates = transactions
    .filter((tx) => tx.day <= demoDay && isCounted(tx, ritm))
    .sort((a, b) => b.amount - a.amount || b.day - a.day)
    .slice(0, 8);
  const target = candidates[0];
  const unlockDay = lock?.unlockDay ?? ritm.lock.unlockDay;
  const lockChosen = (lock !== null && lock.status !== "unlocked") || ritm.lock.amount > 0;

  const actions = notification.actions.filter(
    (a) =>
      (a.kind !== "markPlanned" || target) &&
      (a.kind !== "enableSpeedBump" || !ritm.speedBump) &&
      // Only for someone who chose the Lock: otherwise it would push a feature they said no to.
      (a.kind !== "moveToLock" || lockChosen),
  );

  const values = (a: AlertAction): Record<string, string | number> =>
    a.kind === "moveToLock"
      ? { amount: formatLei(a.amount ?? 0, locale), day: unlockDay, days: RULES.cycleLength - unlockDay + 1 }
      : {};

  const act = (a: AlertAction) => {
    if (a.kind === "markPlanned") return setPicking(true);
    if (a.kind === "moveToLock") lockMoney(a.amount ?? 0);
    if (a.kind === "enableSpeedBump") setFeature("speedBump", true);
    dismiss(notification.id, true);
    setDone(t(`ritm.headsUp.done.${a.kind}`, values(a)));
  };

  const togglePick = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const confirmPlanned = () => {
    const chosen = candidates.filter((tx) => picked.includes(tx.id));
    chosen.forEach((tx) => markPlanned(tx.id));
    dismiss(notification.id, true);
    setPicking(false);
    setDone(
      t("ritm.headsUp.done.markPlannedMany", {
        count: chosen.length,
        amount: formatLei(chosen.reduce((sum, tx) => sum + tx.amount, 0), locale),
      }),
    );
  };

  const close = () => {
    if (!done) dismiss(notification.id, false);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end bg-atlas-ink/40 motion-safe:animate-in motion-safe:fade-in" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && close()}
        className="max-h-[88%] overflow-y-auto rounded-t-3xl bg-white px-5 pt-3 pb-6 shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-bottom-10 motion-safe:duration-300"
      >
        <div aria-hidden className="mx-auto mb-3 h-1 w-10 rounded-full bg-atlas-line" />
        <div className="flex items-start justify-between gap-3">
          <p className={cn("rounded-full px-3 py-1 text-sm font-medium", TAG[notification.severity])}>
            {t("ritm.headsUp.tag", { day: notification.day })}
          </p>
          <button
            type="button"
            onClick={close}
            aria-label={t("ritm.headsUp.close")}
            className="-mt-1 -mr-2 flex size-11 items-center justify-center rounded-full text-atlas-muted focus-visible:outline-2 focus-visible:outline-ritm"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <h2 id={titleId} ref={heading} tabIndex={-1} className="mt-3 font-display text-2xl leading-tight font-semibold outline-none">
          {t(`ritm.headsUp.title.${notification.severity}`)}
        </h2>
        <ul className="mt-3 flex flex-col gap-2">
          {notification.reasons.map((r) => (
            <li key={r.key} className="leading-snug">
              {t(r.key, r.values)}
            </li>
          ))}
        </ul>

        {done ? (
          <div className="mt-6 flex flex-col gap-4">
            <p role="status" className="rounded-2xl bg-ritm-tint px-4 py-3 font-medium text-ritm">
              {done}
            </p>
            <button type="button" onClick={close} className={SECONDARY}>
              {t("ritm.headsUp.close")}
            </button>
          </div>
        ) : picking ? (
          <div className="mt-6 flex flex-col gap-3">
            <p className="font-medium">{t("ritm.headsUp.pick.title")}</p>
            <p className="-mt-2 text-sm text-atlas-muted">{t("ritm.headsUp.pick.hint")}</p>
            <ul className="flex flex-col gap-2">
              {candidates.map((tx) => {
                const on = picked.includes(tx.id);
                return (
                  <li key={tx.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => togglePick(tx.id)}
                      className={cn(
                        "flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 py-2 text-left ring-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm",
                        on ? "bg-ritm-tint ring-ritm" : "ring-atlas-line",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-md border",
                          on ? "border-ritm bg-ritm text-white" : "border-atlas-line bg-white",
                        )}
                      >
                        {on && <Check className="size-4" />}
                      </span>
                      <span className="flex-1">
                        <span className="block font-medium">{tx.merchant}</span>
                        <span className="block text-sm text-atlas-muted">{t("ritm.headsUp.pick.day", { day: tx.day })}</span>
                      </span>
                      <span className="font-medium tabular-nums">{formatLei(tx.amount, locale)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={confirmPlanned}
              disabled={picked.length === 0}
              className="min-h-12 rounded-full bg-ritm px-5 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm disabled:bg-ritm-track disabled:text-atlas-muted"
            >
              {picked.length === 0 ? t("ritm.headsUp.pick.none") : t("ritm.headsUp.pick.confirm", { count: picked.length })}
            </button>
            <button type="button" onClick={() => setPicking(false)} className={SECONDARY}>
              {t("ritm.headsUp.pick.back")}
            </button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            <p className="text-sm text-atlas-muted">{t("ritm.headsUp.intro")}</p>
            {actions.map((a) => (
              <button
                key={a.kind}
                type="button"
                onClick={() => act(a)}
                className="flex min-h-14 flex-col items-start gap-0.5 rounded-2xl px-4 py-3 text-left ring-1 ring-atlas-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm"
              >
                <span className="font-medium text-ritm">{t(a.labelKey, values(a))}</span>
                <span className="text-sm text-atlas-muted">{t(`ritm.headsUp.hint.${a.kind}`, values(a))}</span>
              </button>
            ))}
            <button type="button" onClick={close} className={SECONDARY}>
              {t("ritm.headsUp.later")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const SECONDARY =
  "min-h-12 rounded-full border border-atlas-line bg-white px-5 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm";
