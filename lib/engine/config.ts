/**
 * Every Ritm threshold, from the "Ritm rules" in CLAUDE.md.
 * Change numbers ONLY here; the rules in lib/engine read them.
 */
export const RULES = {
  cycleLength: 30,
  pace: {
    /** Expected spend is never computed below this day. */
    floorDay: 3,
    watchRatio: 1.3,
    spikeRatio: 1.6,
    /** Pace alerts only once this share of spending money is used. */
    minPctSpent: 0.2,
  },
  burst: {
    /** Share of spending money spent in the last 48h that counts as a spike. */
    pct: 0.25,
    windowDays: 2,
  },
  runOut: {
    /** Warn if money runs out at least this many days before payday. */
    warnDaysBeforePayday: 3,
  },
  alerts: {
    /** Re-notify at the same level at most this often (days; 48h = 2 demo days). */
    minDaysBetween: 2,
    /** After this many ignored alerts, suggest the Speed bump. */
    ignoredBeforeSuggest: 2,
  },
  speedBump: {
    thresholdLei: 100,
    confirmDelaySeconds: 5,
  },
  lock: {
    defaultAmount: 500,
    defaultUnlockDay: 20,
    /** Early unlock is released this many days after the request (24h). */
    earlyUnlockDelayDays: 1,
    emergencyMaxLei: 300,
  },
  /** Turning Ritm off takes effect this many days later (24h). */
  turnOffDelayDays: 1,
  /** Tax on savings interest. */
  interestTax: 0.1,
} as const;
