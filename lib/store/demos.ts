import { DEFAULT_RITM_SETTINGS } from "@/lib/data/persona";
import type { BankState } from "./useBank";

/**
 * The demos in the top-left "Demo-uri" menu. Each one resets the demo, sets up the moment
 * it starts from and opens a page. Add a new demo here: an id, two texts in
 * messages/*.json (common.demo.list.<id>.title / .body) and a setup.
 */

export type DemoId = "journey" | "spike" | "unlock" | "payday";

export interface DemoScenario {
  id: DemoId;
  /** Day shown next to the title. */
  day: number;
  /** Page to open after setup. */
  path: string;
  /** Runs after resetDemo(). Use store actions only. */
  setup: (bank: BankState) => void;
}

export const DEMOS: readonly DemoScenario[] = [
  {
    // The full pitch: payday, Ritm off, do the onboarding live.
    id: "journey",
    day: 1,
    path: "/",
    setup: (bank) => bank.setDemoDay(1),
  },
  {
    // Ritm on with the defaults, day 6: the Heads-up is waiting, the jacket will pause.
    id: "spike",
    day: 6,
    path: "/",
    setup: (bank) => {
      bank.enableRitm({ ...DEFAULT_RITM_SETTINGS, level: "speedbump" });
      bank.setDemoDay(6);
    },
  },
  {
    // Day 20: the Lock opens by itself.
    id: "unlock",
    day: 20,
    path: "/",
    setup: (bank) => {
      bank.enableRitm(DEFAULT_RITM_SETTINGS);
      bank.setDemoDay(20);
    },
  },
  {
    // Day 30: payday again, the 500 lei kept saved, ready for the summary.
    id: "payday",
    day: 30,
    path: "/",
    setup: (bank) => {
      bank.enableRitm(DEFAULT_RITM_SETTINGS);
      bank.setDemoDay(20);
      bank.keepSaved(500);
      bank.setDemoDay(30);
    },
  },
];

/** Reset, then set up the chosen demo. Returns the page to open. */
export function startDemo(id: DemoId, getBank: () => BankState): string {
  const demo = DEMOS.find((d) => d.id === id) ?? DEMOS[0];
  const locale = getBank().locale; // keep the language the pitch runs in
  getBank().resetDemo();
  getBank().setLocale(locale);
  demo.setup(getBank());
  return demo.path;
}
