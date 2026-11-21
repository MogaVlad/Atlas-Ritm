"use client";

import { ArrowLeftRight, CreditCard, Map as MapIcon, ReceiptText, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useT } from "@/lib/i18n";
import { useWelcome } from "./welcomeGuide";

const ICON = "flex size-12 items-center justify-center rounded-full bg-white text-atlas-pine ring-1 ring-atlas-line transition-colors group-hover:bg-atlas-sea motion-reduce:transition-none";
const ITEM =
  "group flex min-h-[4.75rem] flex-col items-center justify-start gap-1.5 rounded-2xl pt-1 text-xs font-medium text-atlas-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine";

const LINKS: { href: string; key: string; icon: LucideIcon }[] = [
  { href: "/transfers", key: "transfer", icon: ArrowLeftRight },
  // Payments are simulated (an online shop and an in-store tap): the way to meet the Speed bump.
  { href: "/payments", key: "pay", icon: CreditCard },
  { href: "/transactions", key: "history", icon: ReceiptText },
];

/** What you can do from Home, in one row under the month header. */
export function QuickActions() {
  const t = useT();
  return (
    <nav aria-label={t("bank.actions.label")} className="grid grid-cols-4 gap-2">
      {LINKS.map(({ href, key, icon: Icon }) => (
        <Link key={key} href={href} className={ITEM}>
          <span className={ICON} aria-hidden="true">
            <Icon className="size-5" strokeWidth={1.75} />
          </span>
          {t(`bank.actions.${key}`)}
        </Link>
      ))}
      <button type="button" onClick={() => useWelcome.getState().show()} className={ITEM}>
        <span className={ICON} aria-hidden="true">
          <MapIcon className="size-5" strokeWidth={1.75} />
        </span>
        {t("bank.actions.guide")}
      </button>
    </nav>
  );
}
