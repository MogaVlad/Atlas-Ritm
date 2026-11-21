"use client";

import { CARD_LAST4 } from "@/components/bank/bankData";
import { LanguageSetting } from "@/components/bank/LanguageSetting";
import { RitmSettings } from "@/components/bank/RitmSettings";
import { GuideButton } from "@/components/bank/Welcome";
import { PERSONA } from "@/lib/data/persona";
import { useT } from "@/lib/i18n";

export default function ProfilePage() {
  const t = useT();

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-[1.7rem] leading-tight font-semibold tracking-[-0.02em]">{t("bank.profile.title")}</h1>

      <section aria-label={t("bank.profile.you")} className="flex items-center gap-4">
        <span
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-atlas-ink font-display text-xl font-semibold text-white"
          aria-hidden="true"
        >
          {PERSONA.name.charAt(0)}
        </span>
        <div>
          <p className="font-display text-lg font-semibold">{PERSONA.name}</p>
          <p className="text-sm text-atlas-muted">{t("bank.home.card", { last4: CARD_LAST4 })}</p>
        </div>
      </section>

      <h2 className="mt-2 font-display text-xl font-semibold">{t("bank.profile.ritmTitle")}</h2>
      <RitmSettings />

      <h2 className="mt-2 font-display text-xl font-semibold">{t("bank.profile.appTitle")}</h2>
      <LanguageSetting />
      <GuideButton className="self-start" />
    </div>
  );
}
