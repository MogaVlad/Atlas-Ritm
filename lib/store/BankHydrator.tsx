"use client";

import { useEffect } from "react";
import { useHtmlLang } from "@/lib/i18n";
import { useBank } from "./useBank";

/**
 * Loads the saved demo state from the browser after the first render, so the
 * server HTML (day 1, Romanian) and the first client render always match.
 * Rendered once in app/layout.tsx.
 */
export function BankHydrator() {
  useEffect(() => {
    void useBank.persist.rehydrate();
  }, []);
  useHtmlLang();
  return null;
}
