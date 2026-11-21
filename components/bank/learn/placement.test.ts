import { describe, expect, it } from "vitest";
import { LESSONS, QUESTIONS } from "./content";
import { currentLevel, levelForNext, nextLevel, pickQuestion, placementLevel, reachedSummit, type Answer } from "./placement";

const a = (level: 1 | 2 | 3 | 4 | 5, correct: boolean, id = `x${level}${correct}`): Answer => ({ id, level, correct });

describe("placement test", () => {
  it("starts at level 2 and moves one level per answer, within 1–5", () => {
    expect(levelForNext([])).toBe(2);
    expect(nextLevel(2, true)).toBe(3);
    expect(nextLevel(2, false)).toBe(1);
    expect(nextLevel(5, true)).toBe(5);
    expect(nextLevel(1, false)).toBe(1);
  });

  it("all right ends on level 5, all wrong on level 1", () => {
    expect(placementLevel([a(2, true), a(3, true), a(4, true), a(5, true), a(5, true), a(5, true), a(5, true)])).toBe(5);
    expect(placementLevel([a(2, false), a(1, false), a(1, false), a(1, false), a(1, false), a(1, false), a(1, false)])).toBe(1);
  });

  it("settles where right and wrong answers meet", () => {
    // 2✓ 3✓ 4✗ 3✓ 4✗ 3✓ 4✗ → level 3
    const answers = [a(2, true), a(3, true), a(4, false), a(3, true), a(4, false), a(3, true), a(4, false)];
    expect(placementLevel(answers)).toBe(3);
  });

  it("never places above the highest level answered correctly", () => {
    // ends going up from a right answer on 4, but 5 was never answered → 4
    expect(placementLevel([a(2, false), a(1, true), a(2, true), a(3, false), a(2, true), a(3, true), a(4, true)])).toBe(4);
  });

  it("picks an unused question on the level, or the nearest level with one left", () => {
    expect(pickQuestion(3, [])?.level).toBe(3);
    const level3 = QUESTIONS.filter((q) => q.level === 3).map((q) => q.id);
    expect(pickQuestion(3, level3)?.level).toBe(2);
    expect(pickQuestion(1, QUESTIONS.map((q) => q.id))).toBeNull();
  });

  it("has 3 questions on every level and a valid right answer for each", () => {
    for (let l = 1; l <= 5; l++) expect(QUESTIONS.filter((q) => q.level === l)).toHaveLength(3);
    for (const q of QUESTIONS) expect(q.correct).toBeLessThan(q.options);
  });
});

describe("progress", () => {
  const ids = (level: number) => LESSONS.filter((l) => l.level === level).map((l) => l.id);

  it("starts at the placement level and moves up when a level's lessons are done", () => {
    expect(currentLevel(null, [])).toBe(1);
    expect(currentLevel(3, [])).toBe(3);
    expect(currentLevel(3, ids(3))).toBe(4);
    expect(currentLevel(3, [...ids(3), ...ids(4)])).toBe(5);
  });

  it("levels below the placement count as known; the summit needs level 5 done", () => {
    expect(currentLevel(4, [])).toBe(4);
    expect(reachedSummit(ids(4))).toBe(false);
    expect(reachedSummit(ids(5))).toBe(true);
    expect(currentLevel(5, ids(5))).toBe(5);
  });
});
