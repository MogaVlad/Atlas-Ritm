"use client";

import { create } from "zustand";
import { useBank } from "@/lib/store/useBank";

/** Set once the welcome guide was closed or used; it then only opens from the "Guide" buttons. */
const SEEN_KEY = "atlas-welcome-seen";
/** DemoControls remembers demo mode under this key (?demo=1). Read-only here. */
const DEMO_MODE_KEY = "atlas-demo-mode";

/** The guide can be reopened from Home and Profile. */
export const useWelcome = create<{ open: boolean; show: () => void; hide: () => void }>((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
}));

/**
 * A first-time visitor on the plain link: never saw the guide and isn't in demo mode yet.
 * The team (and the e2e tests) open ?demo=1, so the guide stays out of their way.
 */
export function isFirstVisit(): boolean {
  try {
    if (new URLSearchParams(window.location.search).has("demo")) return false;
    if (window.localStorage.getItem(DEMO_MODE_KEY) === "1") return false;
    return window.localStorage.getItem(SEEN_KEY) !== "1";
  } catch {
    return false;
  }
}

export function markWelcomeSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* storage blocked: the guide may show again next time, nothing worse */
  }
}

function demoModeOn(): boolean {
  try {
    return window.localStorage.getItem(DEMO_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * "Start on payday": day 1 is where the story begins (salary in, Ritm invite). If the demo
 * clock isn't on yet, a reload with ?demo=1 turns it on and remembers it; otherwise just go Home.
 */
export function startOnPayday(goHome: () => void) {
  markWelcomeSeen();
  useBank.getState().setDemoDay(1);
  useWelcome.getState().hide();
  if (demoModeOn()) goHome();
  // A full load on purpose: DemoControls reads ?demo=1 once on mount, so a client push wouldn't show the clock.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  else window.location.assign("/?demo=1");
}
