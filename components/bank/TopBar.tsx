"use client";

import Link from "next/link";
import { useHtmlLang, useT } from "@/lib/i18n";
import { AtlasWordmark } from "./AtlasMark";
import { LocaleToggle } from "./LocaleToggle";

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
      <LocaleToggle />
    </header>
  );
}
