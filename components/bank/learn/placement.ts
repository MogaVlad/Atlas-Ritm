import { LESSONS, QUESTIONS, type Level, type Question } from "./content";

/**
 * The placement test is a staircase: a right answer moves the next question one level up,
 * a wrong one moves it one level down. One step at a time and capped at level 5, so it gets
 * harder without getting extreme.
 */
export const PLACEMENT = { start: 2 as Level, length: 7, min: 1, max: 5 } as const;

export interface Answer {
  id: string;
  level: Level;
  correct: boolean;
}

const clamp = (n: number): Level => Math.min(PLACEMENT.max, Math.max(PLACEMENT.min, n)) as Level;

export function nextLevel(level: number, correct: boolean): Level {
  return clamp(level + (correct ? 1 : -1));
}

/** An unused question at `level`; if that level is used up, the nearest level with one left (lower first). */
export function pickQuestion(level: number, used: readonly string[]): Question | null {
  const unused = QUESTIONS.filter((q) => !used.includes(q.id));
  for (let d = 0; d <= PLACEMENT.max; d++) {
    const found = unused.find((q) => q.level === level - d) ?? unused.find((q) => q.level === level + d);
    if (found) return found;
  }
  return null;
}

/** Level of the next question, given the answers so far. */
export function levelForNext(answers: readonly Answer[]): Level {
  const last = answers.at(-1);
  return last ? nextLevel(last.level, last.correct) : PLACEMENT.start;
}

/**
 * Where the climb starts: where the staircase ended, but never above the highest level answered
 * correctly (nobody is placed above what they showed). All wrong → level 1.
 */
export function placementLevel(answers: readonly Answer[]): Level {
  if (answers.length === 0) return 1;
  const highestRight = Math.max(0, ...answers.filter((a) => a.correct).map((a) => a.level));
  return clamp(Math.min(levelForNext(answers), Math.max(highestRight, 1)));
}

/**
 * The level being learned now: the placement level, then up one each time all of a level's
 * lessons are done. Levels below the placement count as already known.
 */
export function currentLevel(placedAt: number | null, completed: readonly string[]): Level {
  let level = clamp(placedAt ?? 1);
  const done = (l: number) => LESSONS.filter((x) => x.level === l).every((x) => completed.includes(x.id));
  while (level < PLACEMENT.max && done(level)) level = clamp(level + 1);
  return level;
}

/** Every lesson on the top level done. */
export function reachedSummit(completed: readonly string[]): boolean {
  return LESSONS.filter((x) => x.level === PLACEMENT.max).every((x) => completed.includes(x.id));
}
