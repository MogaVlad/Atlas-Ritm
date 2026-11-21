"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useHtmlLang, useT } from "@/lib/i18n";
import { useBank } from "@/lib/store/useBank";
import { AtlasWordmark } from "./AtlasMark";
import { LocaleToggle } from "./LocaleToggle";

function BellLink() {
  const t = useT();
  const unread = useBank((s) => s.notifications.length);
  const label =
    unread === 0
      ? t("bank.notifications.title")
      : unread === 1
        ? t("bank.notifications.bellOne")
        : t("bank.notifications.bellMany", { count: unread });

  return (
    <Link
      href="/notifications"
      aria-label={label}
      className="relative flex size-11 items-center justify-center rounded-full text-atlas-ink hover:bg-atlas-sea/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine"
    >
      <Bell className="size-5" aria-hidden="true" />
      {unread > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-1.5 right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ritm-spike px-1 text-[0.68rem] leading-none font-semibold text-white ring-2 ring-atlas-paper tabular-nums"
        >
          {unread}
        </span>
      )}
    </Link>
  );
}

export function TopBar() {
  useHtmlLang();
  const t = useT();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-atlas-line/70 bg-atlas-paper/95 px-5 pt-3 pb-2 backdrop-blur">
      <Link
        href="/"
        aria-label={t("bank.brand.homeLink")}
        className="-ml-1 flex min-h-11 items-center rounded-lg px-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine"
      >
        <AtlasWordmark />
      </Link>
      <div className="flex items-center gap-1">
        <BellLink />
        <LocaleToggle />
      </div>
    </header>
  );
}
