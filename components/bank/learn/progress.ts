"use client";

import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type { Level } from "./content";

/** Learning progress, kept in this browser apart from the demo bank (its own key, its own reset). */
interface LearnState {
  /** Level the placement test put the person on; null until the test is taken (or skipped). */
  placedAt: Level | null;
  placementRight: number;
  placementTotal: number;
  /** Finished lesson ids. */
  completed: string[];
  setPlacement: (level: Level, right: number, total: number) => void;
  completeLesson: (id: string) => void;
  reset: () => void;
}

const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return window.localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      window.localStorage.setItem(k, v);
    } catch {
      /* storage blocked: progress lasts until reload */
    }
  },
  removeItem: (k) => {
    try {
      window.localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

const EMPTY = { placedAt: null, placementRight: 0, placementTotal: 0, completed: [] as string[] };

export const useLearn = create<LearnState>()(
  persist(
    (set) => ({
      ...EMPTY,
      setPlacement: (placedAt, placementRight, placementTotal) => set({ placedAt, placementRight, placementTotal }),
      completeLesson: (id) => set((s) => (s.completed.includes(id) ? s : { completed: [...s.completed, id] })),
      reset: () => set({ ...EMPTY }),
    }),
    {
      name: "atlas-learn",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      // Loaded after the first render (see useLearnReady), so server and client HTML match.
      skipHydration: true,
    },
  ),
);

const onHydrated = (cb: () => void) => useLearn.persist.onFinishHydration(cb);
const isHydrated = () => useLearn.persist.hasHydrated();

/** True once the saved progress is loaded. Learn pages render nothing until then (no flash of "not placed"). */
export function useLearnReady(): boolean {
  useEffect(() => {
    if (!useLearn.persist.hasHydrated()) void useLearn.persist.rehydrate();
  }, []);
  return useSyncExternalStore(onHydrated, isHydrated, () => false);
}
