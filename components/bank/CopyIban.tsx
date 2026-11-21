"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useT } from "@/lib/i18n";

/** IBAN with a copy button; confirms with "Copiat" for 2 seconds. */
export function CopyIban({ iban, tone = "light" }: { iban: string; tone?: "light" | "dark" }) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(iban.replace(/\s/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (e.g. insecure context): the IBAN stays visible to copy by hand.
    }
  }

  const dark = tone === "dark";
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className={`text-sm ${dark ? "text-white/75" : "text-atlas-muted"}`}>{t("bank.accounts.iban")}</p>
        <p className="font-medium tracking-wide tabular-nums">{iban}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 ${
          dark
            ? "bg-white/12 text-white hover:bg-white/20 focus-visible:outline-white"
            : "bg-atlas-sea text-atlas-pine hover:bg-atlas-sea/70 focus-visible:outline-atlas-pine"
        }`}
      >
        {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
        <span aria-live="polite">{copied ? t("bank.accounts.copied") : t("bank.accounts.copy")}</span>
      </button>
    </div>
  );
}
