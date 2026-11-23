import type { HeadsUpNotification } from "@/lib/store/useBank";

/** The title of a Heads-up: the soft "your usual rhythm" note or the level's title. */
export function headsUpTitleKey(n: Pick<HeadsUpNotification, "severity" | "variant">): string {
  return n.variant === "habit" ? "ritm.headsUp.habit.title" : `ritm.headsUp.title.${n.severity}`;
}

/** The first line under the title: for the soft note, the habits behind it; otherwise the first reason. */
export function headsUpLine(
  n: Pick<HeadsUpNotification, "variant" | "habits" | "reasons">,
): { key: string; values?: Record<string, string | number> } | null {
  if (n.variant === "habit") return { key: "ritm.headsUp.habit.body", values: { habits: (n.habits ?? []).join(", ") } };
  return n.reasons[0] ?? null;
}
