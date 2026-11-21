import type { ISODate } from "./types";

const DAY_MS = 86_400_000;

export const toDate = (d: ISODate): Date => new Date(`${d}T00:00:00Z`);
export const toISODate = (d: Date): ISODate => d.toISOString().slice(0, 10);
export const addDays = (d: ISODate, n: number): ISODate => toISODate(new Date(toDate(d).getTime() + n * DAY_MS));

/** Whole days from a to b (positive when b is later). */
export const daysBetween = (a: ISODate, b: ISODate): number =>
  Math.round((toDate(b).getTime() - toDate(a).getTime()) / DAY_MS);

/** `dayOfMonth` in the given month, clamped (31 in February → 28/29). Month overflow is normalised. */
export function dayInMonth(year: number, month0: number, dayOfMonth: number): ISODate {
  const first = new Date(Date.UTC(year, month0, 1));
  const y = first.getUTCFullYear();
  const m = first.getUTCMonth();
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return toISODate(new Date(Date.UTC(y, m, Math.min(dayOfMonth, last))));
}

export interface Cycle {
  /** Most recent payday on or before today. */
  start: ISODate;
  nextPayday: ISODate;
  length: number;
  /** 1 on payday. */
  dayOfCycle: number;
  /** Days left including today, ≥ 1. */
  daysLeft: number;
}

export function getCycle(today: ISODate, payday: number): Cycle {
  const t = toDate(today);
  const thisMonth = dayInMonth(t.getUTCFullYear(), t.getUTCMonth(), payday);
  const start = today >= thisMonth ? thisMonth : dayInMonth(t.getUTCFullYear(), t.getUTCMonth() - 1, payday);
  const s = toDate(start);
  const nextPayday = dayInMonth(s.getUTCFullYear(), s.getUTCMonth() + 1, payday);
  const length = daysBetween(start, nextPayday);
  const dayOfCycle = daysBetween(start, today) + 1;
  return { start, nextPayday, length, dayOfCycle, daysLeft: length - dayOfCycle + 1 };
}

/** Dates in [from, to) on which a monthly item due on `dayOfMonth` falls. */
export function occurrencesBetween(from: ISODate, to: ISODate, dayOfMonth: number): ISODate[] {
  const f = toDate(from);
  const out: ISODate[] = [];
  for (let i = 0; i < 3; i++) {
    const d = dayInMonth(f.getUTCFullYear(), f.getUTCMonth() + i, dayOfMonth);
    if (d >= from && d < to) out.push(d);
  }
  return out;
}
