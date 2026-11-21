"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";

/** Navigation API (Chrome, Edge, Safari 26+): canGoBack is true only when the previous entry is on this site. */
type WithNavigation = Window & { navigation?: { canGoBack: boolean } };

/** Leave a full-screen Ritm page: previous page if it's ours, otherwise Home. Keeps ?demo=1. */
export function leaveRitm(router: ReturnType<typeof useRouter>) {
  const canGoBack = (window as WithNavigation).navigation?.canGoBack ?? window.history.length > 1;
  if (canGoBack) return router.back();
  const demo = new URLSearchParams(window.location.search).has("demo");
  router.push(demo ? "/?demo=1" : "/");
}

/** "Back to Atlas" at the top of full-screen Ritm pages. */
export function RitmBack() {
  const t = useT();
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => leaveRitm(router)}
      className="-ml-2 flex min-h-11 w-fit items-center gap-1 rounded-lg pr-3 pl-1 text-sm font-medium text-atlas-pine focus-visible:outline-2 focus-visible:outline-atlas-pine"
    >
      <ChevronLeft className="size-5" aria-hidden="true" />
      {t("ritm.common.back")}
    </button>
  );
}
