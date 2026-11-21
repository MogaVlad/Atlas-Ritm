"use client";

import { Toast } from "@/components/bank/Toast";
import { useT } from "@/lib/i18n";
import { useFlash } from "./flash";

/** Shows the pending flash message as a toast above the bottom nav. Rendered in app/(bank)/layout.tsx. */
export function FlashToast() {
  const t = useT();
  const flash = useFlash((s) => s.flash);
  const clear = useFlash((s) => s.clear);

  return (
    <Toast open={flash !== null} onClose={clear} durationMs={5000}>
      {flash && t(flash.key, flash.values)}
    </Toast>
  );
}
