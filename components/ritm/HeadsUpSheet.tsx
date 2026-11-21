"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { isCounted, type AlertAction } from "@/lib/engine";
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

  const ritm = useBank((s) => s.ritm);
  const lock = useBank((s) => s.lock);
  const demoDay = useBank((s) => s.demoDay);
  const transactions = useBank((s) => s.transactions);
  const lockMoney = useBank((s) => s.lockMoney);
  const setLevel = useBank((s) => s.setLevel);
  const markPlanned = useBank((s) => s.markPlanned);
  const dismiss = useBank((s) => s.dismissNotification);

  useEffect(() => heading.current?.focus(), []);

  // "Mark as planned" refers to the latest, biggest purchase that still counts.
  const target = transactions
    .filter((tx) => tx.day <= demoDay && isCounted(tx, ritm))
    .sort((a, b) => b.day - a.day || b.amount - a.amount)[0];
  const unlockDay = lock?.unlockDay ?? ritm.lock.unlockDay;

  const actions = notification.actions.filter(
    (a) => (a.kind !== "markPlanned" || target) && (a.kind !== "enableSpeedBump" || ritm.level === "headsup"),
  );

  const values = (a: AlertAction): Record<string, string | number> =>
    a.kind === "moveToLock"
      ? { amount: formatLei(a.amount ?? 0, locale), day: unlockDay }
      : a.kind === "markPlanned" && target
        ? { merchant: target.merchant, amount: formatLei(target.amount, locale) }
        : {};

  const act = (a: AlertAction) => {
    if (a.kind === "moveToLock") lockMoney(a.amount ?? 0);
    if (a.kind === "enableSpeedBump") setLevel("speedbump");
    if (a.kind === "markPlanned" && target) markPlanned(target.id);
    dismiss(notification.id, true);
    setDone(t(`ritm.headsUp.done.${a.kind}`, values(a)));
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
