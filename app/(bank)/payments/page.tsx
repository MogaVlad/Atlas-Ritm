"use client";

import { useT } from "@/lib/i18n";

/** Placeholder until the payments task lands. */
export default function Page() {
  const t = useT();
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-display text-[1.7rem] leading-tight font-semibold tracking-[-0.02em]">{t("bank.payments.title")}</h1>
      <p className="text-atlas-muted">{t("bank.payments.comingSoon")}</p>
    </div>
  );
}
