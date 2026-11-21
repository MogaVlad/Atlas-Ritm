import { create } from "zustand";

/** A one-off message for the next screen (e.g. "saved" after the unlock screen closes). Not persisted. */
export interface Flash {
  key: string;
  values?: Record<string, string | number>;
}

export const useFlash = create<{ flash: Flash | null; show: (flash: Flash) => void; clear: () => void }>()((set) => ({
  flash: null,
  show: (flash) => set({ flash }),
  clear: () => set({ flash: null }),
}));
