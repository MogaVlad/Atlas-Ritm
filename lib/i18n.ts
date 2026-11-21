"use client";

import { useCallback, useEffect } from "react";
import { create } from "zustand";
import en from "@/messages/en.json";
import ro from "@/messages/ro.json";

export type Locale = "ro" | "en";

type Messages = { [key: string]: string | Messages };
const MESSAGES: Record<Locale, Messages> = { ro, en };

/** Locale store. Will be folded into useBank (C5); keep the same names. */
export const useLocale = create<{ locale: Locale; setLocale: (l: Locale) => void }>((set) => ({
  locale: "ro",
  setLocale: (locale) => set({ locale }),
}));

/** Looks up "namespace.key" and fills {placeholders}. Missing keys return the key itself. */
export function translate(locale: Locale, key: string, values?: Record<string, string | number>): string {
  let node: string | Messages | undefined = MESSAGES[locale];
  for (const part of key.split(".")) {
    node = typeof node === "object" ? node[part] : undefined;
  }
  if (typeof node !== "string") return key;
  if (!values) return node;
  return node.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match));
}

/** useT() → t('bank.home.title', { name: 'Andrei' }) */
export function useT() {
  const locale = useLocale((s) => s.locale);
  return useCallback(
    (key: string, values?: Record<string, string | number>) => translate(locale, key, values),
    [locale],
  );
}

/** Keeps <html lang> in sync with the chosen locale (screen readers, hyphenation). */
export function useHtmlLang() {
  const locale = useLocale((s) => s.locale);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
}
