"use client";

import { BackLink } from "./BackLink";
import { CARD_LAST4, useDemoDay } from "./bankData";
import { CategoryIcon } from "./categories";
import { dayLabel } from "./dates";
import { signedLei } from "./TransactionRow";
import { isCounted, type RitmSettings, type Transaction } from "@/lib/engine";
import { useLocale, useT } from "@/lib/i18n";
import { useBank } from "@/lib/store/useBank";

/**
 * Why a transaction does or doesn't count in Ritm, as an i18n key.
 * The yes/no answer comes from the engine (isCounted); this only picks the sentence.
 */
function ritmNoteKey(tx: Transaction, settings: RitmSettings): string {
  if (isCounted(tx, settings)) return "bank.detail.ritm.counted";
  if (tx.amount < 0) return "bank.detail.ritm.moneyIn";
  if (tx.planned) return "bank.detail.ritm.planned";
  if (settings.essentialCategories.includes(tx.category)) return "bank.detail.ritm.essential";
  return "bank.detail.ritm.notCounted";
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 py-3">
      <dt className="text-sm text-atlas-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

export function TransactionDetail({ id }: { id: string }) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const today = useDemoDay();
  const settings = useBank((s) => s.ritm);
  const tx = useBank((s) => s.transactions.find((x) => x.id === id && x.day <= s.demoDay));

  if (!tx) {
    return (
      <div className="flex flex-col">
        <BackLink href="/transactions" label={t("bank.transactions.title")} />
        <p className="mt-6 text-atlas-muted">{t("bank.detail.notFound")}</p>
      </div>
    );
  }

  const incoming = tx.amount < 0;
  const byCard = tx.channel === "card_in_store" || tx.channel === "card_online";
  const counted = isCounted(tx, settings);

  return (
    <div className="flex flex-col">
      <BackLink href="/transactions" label={t("bank.transactions.title")} />

      <div className="mt-4 flex flex-col items-center text-center">
        <CategoryIcon category={tx.category} incoming={incoming} size="lg" />
        <h1 className="mt-4 font-display text-xl font-semibold">{tx.merchant}</h1>
        <p
          className={`mt-1 font-display text-[2.4rem] leading-tight font-semibold tracking-[-0.03em] tabular-nums ${
            incoming ? "text-atlas-pine" : "text-atlas-ink"
          }`}
        >
          {signedLei(tx.amount, locale)}
        </p>
        <p className="mt-1 text-sm text-atlas-muted">{dayLabel(tx.day, today, locale, t)}</p>
      </div>

      <dl className="mt-6 divide-y divide-atlas-line rounded-3xl border border-atlas-line bg-white px-5">
        <Row label={t("bank.detail.category")} value={t(`bank.categories.${tx.category}`)} />
        <Row label={t("bank.detail.method")} value={t(`bank.channels.${tx.channel}`)} />
        {byCard && <Row label={t("bank.detail.card")} value={`••• ${CARD_LAST4}`} />}
        <Row label={t("bank.detail.account")} value={t("bank.home.balanceLabel")} />
      </dl>

      <section
        aria-labelledby="ritm-note-title"
        className={`mt-4 rounded-3xl p-5 ${counted ? "bg-atlas-sea/60" : "border border-dashed border-atlas-line"}`}
      >
        <h2 id="ritm-note-title" className="font-medium">
          {t(counted ? "bank.detail.ritm.countedTitle" : "bank.detail.ritm.notCountedTitle")}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-atlas-muted">{t(ritmNoteKey(tx, settings))}</p>
      </section>
    </div>
  );
}
