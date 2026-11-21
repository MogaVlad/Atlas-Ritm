"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHtmlLang, useT } from "@/lib/i18n";
import { useBank } from "@/lib/store/useBank";
import { cn } from "@/lib/utils";
import { AtlasWordmark } from "./AtlasMark";

function BellLink({ onInk }: { onInk: boolean }) {
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
      className={cn(
        "relative flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2",
        onInk ? "text-white hover:bg-white/10 focus-visible:outline-white" : "text-atlas-ink hover:bg-atlas-sea/60 focus-visible:outline-atlas-pine",
      )}
    >
      <Bell className="size-5" aria-hidden="true" />
      {unread > 0 && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-1.5 right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ritm-spike px-1 text-[0.68rem] leading-none font-semibold text-white ring-2 tabular-nums",
            onInk ? "ring-atlas-ink" : "ring-atlas-paper",
          )}
        >
          {unread}
        </span>
      )}
    </Link>
  );
}

/** On Home the bar is ink and runs straight into the month header below it; elsewhere it is paper. */
export function TopBar() {
  useHtmlLang();
  const t = useT();
  const onInk = usePathname() === "/";

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex items-center justify-between px-5 pt-3 pb-2",
        onInk ? "bg-atlas-ink" : "border-b border-atlas-line/70 bg-atlas-paper/95 backdrop-blur",
      )}
    >
      <Link
        href="/"
        aria-label={t("bank.brand.homeLink")}
        className={cn(
          "-ml-1 flex min-h-11 items-center rounded-lg px-1 focus-visible:outline-2 focus-visible:outline-offset-2",
          onInk ? "focus-visible:outline-white" : "focus-visible:outline-atlas-pine",
        )}
      >
        <AtlasWordmark tone={onInk ? "light" : "ink"} />
      </Link>
      {/* The language is a setting in Profile, not a switch on every screen. */}
      <BellLink onInk={onInk} />
    </header>
  );
}
