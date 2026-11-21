"use client";

import { Activity } from "lucide-react";
import { RitmCard } from "@/components/ritm/RitmCard";
import { useT } from "@/lib/i18n";
import { useBank } from "@/lib/store/useBank";

/**
 * Slot for Horia's <RitmCard/> (H3). Until it lands, shows a quiet placeholder.
 * When components/ritm/RitmCard.tsx exists, render it here instead.
 */
export function RitmSlot() {
  const t = useT();
  const enabled = useBank((s) => s.ritm.enabled);
  if (enabled) return <RitmCard />;

  return (
    <section
      aria-labelledby="ritm-slot-title"
      className="flex gap-4 rounded-3xl border border-dashed border-atlas-line bg-white/60 p-5"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-atlas-sea text-atlas-pine" aria-hidden="true">
        <Activity className="size-5" />
      </span>
      <div>
        <h2 id="ritm-slot-title" className="font-display text-lg font-semibold text-atlas-ink">
          {t("bank.ritmSlot.title")}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-atlas-muted">{t("bank.ritmSlot.body")}</p>
      </div>
    </section>
  );
}
