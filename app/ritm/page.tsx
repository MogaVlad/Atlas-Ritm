"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBank } from "@/lib/store/useBank";

// shortcut: no Ritm dashboard yet; Ritm off → onboarding, on → Home (where RitmCard lives).
export default function RitmIndex() {
  const router = useRouter();

  useEffect(() => {
    // Wait for the saved demo state, or a reload would always look like "Ritm off".
    const go = () => router.replace(useBank.getState().ritm.enabled ? "/" : "/ritm/onboarding");
    if (useBank.persist.hasHydrated()) go();
    else return useBank.persist.onFinishHydration(go);
  }, [router]);

  return null;
}
