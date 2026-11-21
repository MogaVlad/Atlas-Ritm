"use client";

import { Activity, ArrowLeftRight, House, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";

const TABS: { href: string; key: string; icon: LucideIcon; match: (p: string) => boolean }[] = [
  { href: "/", key: "home", icon: House, match: (p) => p === "/" || p.startsWith("/transactions") || p.startsWith("/accounts") },
  { href: "/payments", key: "payments", icon: ArrowLeftRight, match: (p) => p.startsWith("/payments") },
  { href: "/ritm", key: "ritm", icon: Activity, match: (p) => p.startsWith("/ritm") },
  { href: "/profile", key: "profile", icon: UserRound, match: (p) => p.startsWith("/profile") },
];

export function BottomNav() {
  const t = useT();
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("bank.nav.label")}
      className="sticky bottom-0 z-20 border-t border-atlas-line bg-atlas-paper/95 px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur"
    >
      <ul className="grid grid-cols-4">
        {TABS.map(({ href, key, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={key}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="group flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[0.72rem] font-medium text-atlas-muted transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-atlas-pine aria-[current=page]:text-atlas-ink"
              >
                <span className="flex h-7 w-12 items-center justify-center rounded-full transition-colors group-aria-[current=page]:bg-atlas-sea">
                  <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
                </span>
                {t(`bank.nav.${key}`)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
