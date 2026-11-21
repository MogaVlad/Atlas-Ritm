/**
 * Financial education content: 5 levels (camps on the Atlas mountain), the placement questions
 * and the lessons. Only structure lives here; every visible word is in messages/*.json under
 * bank.learn.* (q.<id>, lessons.<id>, levels.<n>).
 */

export type Level = 1 | 2 | 3 | 4 | 5;

/** Camps on the way up. Altitude is the scale people see: "you start at 1,500 m". */
export const LEVELS: readonly { level: Level; altitude: number }[] = [
  { level: 1, altitude: 500 },
  { level: 2, altitude: 1000 },
  { level: 3, altitude: 1500 },
  { level: 4, altitude: 2000 },
  { level: 5, altitude: 2500 },
];

export interface Question {
  id: string;
  level: Level;
  /** Index of the right option in messages bank.learn.q.<id>.a */
  correct: number;
  options: number;
}

/** Three per level, from "net vs gross" up to Pillar III. Moderate at the top on purpose. */
export const QUESTIONS: readonly Question[] = [
  { id: "q1", level: 1, correct: 0, options: 3 },
  { id: "q2", level: 1, correct: 1, options: 3 },
  { id: "q3", level: 1, correct: 2, options: 3 },
  { id: "q4", level: 2, correct: 1, options: 3 },
  { id: "q5", level: 2, correct: 0, options: 3 },
  { id: "q6", level: 2, correct: 2, options: 3 },
  { id: "q7", level: 3, correct: 2, options: 3 },
  { id: "q8", level: 3, correct: 0, options: 3 },
  { id: "q9", level: 3, correct: 1, options: 3 },
  { id: "q10", level: 4, correct: 1, options: 3 },
  { id: "q11", level: 4, correct: 0, options: 3 },
  { id: "q12", level: 4, correct: 2, options: 3 },
  { id: "q13", level: 5, correct: 0, options: 3 },
  { id: "q14", level: 5, correct: 2, options: 3 },
  { id: "q15", level: 5, correct: 1, options: 3 },
];

/** A card computed from the person's own Atlas numbers ("on your money"). */
export type MoneyCard = "net" | "fixed" | "rule" | "emergency" | "interest" | "pension";

export interface Lesson {
  id: string;
  level: Level;
  /** Two short explanation cards: bank.learn.lessons.<id>.cards.0/1 */
  cards: 2;
  money: MoneyCard | null;
  check: { correct: number; options: number };
  /** Where in Atlas to use what was learned. */
  apply: { href: string } | null;
}

export const LESSONS: readonly Lesson[] = [
  { id: "net", level: 1, cards: 2, money: "net", check: { correct: 0, options: 3 }, apply: { href: "/accounts/current" } },
  { id: "fixed", level: 1, cards: 2, money: "fixed", check: { correct: 1, options: 3 }, apply: { href: "/profile" } },
  { id: "rule", level: 2, cards: 2, money: "rule", check: { correct: 2, options: 3 }, apply: { href: "/ritm" } },
  { id: "emergency", level: 2, cards: 2, money: "emergency", check: { correct: 0, options: 3 }, apply: { href: "/transfers" } },
  { id: "interest", level: 3, cards: 2, money: "interest", check: { correct: 1, options: 3 }, apply: { href: "/accounts/savings" } },
  { id: "inflation", level: 3, cards: 2, money: null, check: { correct: 0, options: 3 }, apply: null },
  { id: "apr", level: 4, cards: 2, money: null, check: { correct: 2, options: 3 }, apply: null },
  { id: "card", level: 4, cards: 2, money: null, check: { correct: 0, options: 3 }, apply: null },
  { id: "horizon", level: 5, cards: 2, money: null, check: { correct: 1, options: 3 }, apply: null },
  { id: "pillar3", level: 5, cards: 2, money: "pension", check: { correct: 0, options: 3 }, apply: null },
];

export const lessonsOf = (level: number) => LESSONS.filter((l) => l.level === level);
export const findLesson = (id: string) => LESSONS.find((l) => l.id === id);
export const altitudeOf = (level: number) => LEVELS.find((l) => l.level === level)?.altitude ?? 0;
