"use client";

import { create } from "zustand";
import { DEFAULT_RITM_SETTINGS } from "@/lib/data/persona";
import type { RitmSettings } from "@/lib/engine";

export type PlannedPurchase = { name: string; amount: number };

type MockBank = {
  ritm: RitmSettings;
  plannedPurchases: PlannedPurchase[];
  enableRitm: (settings: RitmSettings, planned?: PlannedPurchase[]) => void;
};

// shortcut: in-memory stand-in for lib/store/useBank (C5), same names; swap the import when C5 merges.
export const useBank = create<MockBank>((set) => ({
  ritm: DEFAULT_RITM_SETTINGS,
  plannedPurchases: [],
  enableRitm: (settings, planned = []) => set({ ritm: { ...settings, enabled: true }, plannedPurchases: planned }),
}));
