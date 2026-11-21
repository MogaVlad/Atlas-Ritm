"use client";

import { useSyncExternalStore } from "react";
import { useBank } from "@/lib/store/useBank";

/** True once the saved demo state is loaded; before that, "Ritm off" or "no Lock" is just the default. */
export function useHydrated() {
  return useSyncExternalStore(
    (onChange) => useBank.persist.onFinishHydration(onChange),
    () => useBank.persist.hasHydrated(),
    () => false,
  );
}
