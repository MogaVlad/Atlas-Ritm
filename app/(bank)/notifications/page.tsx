"use client";

import { Activity, BellOff, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BackLink } from "@/components/bank/BackLink";
import { useDemoDay } from "@/components/bank/bankData";
import { CategoryIcon } from "@/components/bank/categories";
import { dayLabel } from "@/components/bank/dates";
import { useActivity, type ActivityItem } from "@/components/bank/notifications";
import { HeadsUpSheet } from "@/components/ritm/HeadsUpSheet";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { useBank, type HeadsUpNotification } from "@/lib/store/useBank";

const ROW =
  "-mx-2 flex min-h-16 w-[calc(100%+1rem)] items-start gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-atlas-sea/40 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-atlas-pine";

export default function NotificationsPage() {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const today = useDemoDay();
  const headsUps = useBank((s) => s.notifications);
  const activity = useActivity();
  const [sheet, setSheet] = useState<HeadsUpNotification | null>(null);

  const activityText = (item: ActivityItem) =>
    item.kind === "salary"
      ? {
          title: t("bank.notifications.salaryTitle"),
          body: t("bank.notifications.salaryBody", { amount: formatLei(-item.tx.amount, locale), from: item.tx.merchant }),
        }
      : {
          title: t("bank.notifications.paymentTitle"),
          body: t("bank.notifications.paymentBody", { amount: formatLei(item.tx.amount, locale), merchant: item.tx.merchant }),
        };

  return (
    <div className="flex flex-col">
      <BackLink href="/" label={t("bank.nav.home")} />
      <h1 className="mt-1 font-display text-[1.7rem] leading-tight font-semibold tracking-[-0.02em]">
        {t("bank.notifications.title")}
      </h1>

      {headsUps.length === 0 && activity.length === 0 && (
        <div className="mt-10 flex flex-col items-center text-center">
          <BellOff className="size-8 text-atlas-muted" aria-hidden="true" />
          <p className="mt-3 max-w-64 text-atlas-muted">{t("bank.notifications.empty")}</p>
        </div>
      )}

      {headsUps.length > 0 && (
        <section aria-labelledby="notif-new" className="mt-6">
          <h2 id="notif-new" className="text-sm font-medium text-atlas-muted">
            {t("bank.notifications.new")}
          </h2>
          <ul className="mt-1 divide-y divide-atlas-line">
            {[...headsUps].reverse().map((n) => {
              const reason = n.reasons[0];
              return (
                <li key={n.id}>
                  <button type="button" onClick={() => setSheet(n)} className={ROW}>
                    <span
                      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ritm-tint text-ritm"
                      aria-hidden="true"
                    >
                      <Activity className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2 text-xs text-atlas-muted">
                        <span>{t("bank.notifications.ritm")}</span>
                        <span>{dayLabel(n.day, today, locale, t)}</span>
                      </span>
                      <span className="mt-0.5 block font-medium">{t(`ritm.headsUp.title.${n.severity}`)}</span>
                      {reason && <span className="mt-0.5 block text-sm leading-snug text-atlas-muted">{t(reason.key, reason.values)}</span>}
                    </span>
                    <span className="mt-1 size-2.5 shrink-0 rounded-full bg-ritm-spike" aria-hidden="true" />
                    <span className="sr-only">{t("bank.notifications.unread")}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {activity.length > 0 && (
        <section aria-labelledby="notif-earlier" className="mt-6">
          <h2 id="notif-earlier" className="text-sm font-medium text-atlas-muted">
            {t("bank.notifications.earlier")}
          </h2>
          <ul className="mt-1 divide-y divide-atlas-line">
            {activity.map((item) => {
              const { title, body } = activityText(item);
              return (
                <li key={item.id}>
                  <Link href={`/transactions/${item.tx.id}`} className={ROW}>
                    <CategoryIcon category={item.tx.category} incoming={item.kind === "salary"} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2 text-xs text-atlas-muted">
                        <span>{t("bank.notifications.app")}</span>
                        <span>{dayLabel(item.day, today, locale, t)}</span>
                      </span>
                      <span className="mt-0.5 block font-medium">{title}</span>
                      <span className="mt-0.5 block text-sm leading-snug text-atlas-muted">{body}</span>
                    </span>
                    <ChevronRight className="mt-3 size-4 shrink-0 text-atlas-muted" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {sheet && <HeadsUpSheet notification={sheet} onClose={() => setSheet(null)} />}
    </div>
  );
}
