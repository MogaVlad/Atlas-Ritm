"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBank } from "@/components/ritm/mockBank";

// shortcut: no Ritm dashboard yet; Ritm off → onboarding, on → Home (where RitmCard lands in H3).
export default function RitmIndex() {
  const router = useRouter();
  const enabled = useBank((s) => s.ritm.enabled);

  useEffect(() => {
    router.replace(enabled ? "/" : "/ritm/onboarding");
  }, [enabled, router]);

  return null;
}
