"use client";

import { Activity } from "lucide-react";
import Link from "next/link";
import { RitmCard } from "@/components/ritm/RitmCard";
import { useT } from "@/lib/i18n";
import { useBank } from "@/lib/store/useBank";
import { useSalaryToday } from "./SalaryMoment";

/** Ritm on Home: Horia's <RitmCard/> when Ritm is on, otherwise an invitation to turn it on. */
export function RitmSlot() {
  const enabled = useBank((s) => s.ritm.enabled);
  if (enabled) return <RitmCard />;
  return <RitmInvite />;
}

function RitmInvite() {
  const t = useT();
  const payday = useSalaryToday() !== undefined;

  return (
    <section aria-labelledby="ritm-invite-title" className="rounded-3xl bg-white p-5 ring-1 ring-atlas-line">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ritm-tint text-ritm" aria-hidden="true">
          <Activity className="size-5" />
        </span>
        <h2 id="ritm-invite-title" className="font-display text-lg font-semibold">
          {t("bank.ritmInvite.title")}
        </h2>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-atlas-ink/80">
        {t(payday ? "bank.ritmInvite.bodyPayday" : "bank.ritmInvite.body")}
      </p>
      <Link
        href="/ritm/onboarding"
        className="mt-4 flex min-h-12 items-center justify-center rounded-full bg-ritm px-5 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm"
      >
        {t("bank.ritmInvite.cta")}
      </Link>
      <p className="mt-2 text-center text-xs text-atlas-muted">{t("bank.ritmInvite.note")}</p>
    </section>
  );
}
