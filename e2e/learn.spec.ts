import { expect, test, type Page } from "@playwright/test";
import { LESSONS, QUESTIONS } from "../components/bank/learn/content";
import m from "../messages/en.json";

/**
 * Learn: the adaptive placement test and a lesson, in English at 390×844.
 * Every browser test starts with empty storage, so each test starts before the test.
 */

const L = m.bank.learn;
const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
const exact = (text: string) => new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
const option = (block: { a: Record<string, string> }, i: number) => block.a[String(i)];

async function openLearn(page: Page) {
  await page.goto("/?demo=1");
  await page.getByRole("navigation").getByRole("link", { name: m.bank.nav.learn }).click();
  await expect(page.getByRole("heading", { name: L.introTitle })).toBeVisible();
}

/** Answers the question on screen, right or wrong, and returns its level. */
async function answer(page: Page, right: boolean) {
  const text = await page.locator("#placement-q").innerText();
  const id = Object.entries(L.q).find(([, v]) => v.q === text)?.[0];
  const question = QUESTIONS.find((q) => q.id === id);
  if (!question) throw new Error(`Unknown question: ${text}`);
  const pick = right ? question.correct : (question.correct + 1) % question.options;
  await page.getByRole("button", { name: exact(option(L.q[question.id as keyof typeof L.q], pick)) }).click();
  await expect(page.getByText(right ? L.test.right : L.test.wrong, { exact: true })).toBeVisible();
  return question.level;
}

test("placement: each right answer climbs a level, all right starts at the summit camp", async ({ page }) => {
  await openLearn(page);
  await page.getByRole("link", { name: L.startTest }).click();

  const levels: number[] = [];
  for (let i = 1; i <= 7; i++) {
    await expect(page.getByText(fill(L.test.question, { i, n: 7 }), { exact: true })).toBeVisible();
    levels.push(await answer(page, true));
    await page.locator("main").getByRole("button", { name: i === 7 ? L.test.seeResult : L.test.next, exact: true }).click();
  }
  // Starts in the middle, then one level harder per right answer, never past level 5.
  expect(levels.slice(0, 4)).toEqual([2, 3, 4, 5]);
  expect(Math.max(...levels)).toBe(5);

  await expect(page.getByRole("heading", { name: fill(L.test.resultTitle, { alt: "2,500 m" }) })).toBeVisible();
  await expect(page.getByText(fill(L.test.resultScore, { right: 7, total: 7 }))).toBeVisible();
});

test("placement: a wrong answer makes the next question easier", async ({ page }) => {
  await openLearn(page);
  await page.getByRole("link", { name: L.startTest }).click();
  expect(await answer(page, false)).toBe(2);
  await page.locator("main").getByRole("button", { name: L.test.next, exact: true }).click();
  expect(await answer(page, true)).toBe(1);
});

test("lesson: cards, your own numbers, a second try, then the climb to the next camp", async ({ page }) => {
  await openLearn(page);
  await page.getByRole("button", { name: L.skipTest }).click();
  await expect(page.getByRole("heading", { name: fill(L.here, { alt: "500 m", name: L.levels["1"].name }) })).toBeVisible();

  // Higher camps stay closed until the one below is done.
  await expect(page.getByText(fill(L.lockedAfter, { name: L.levels["1"].name }))).toBeVisible();

  const [first, second] = LESSONS.filter((l) => l.level === 1);
  await page.getByRole("link", { name: new RegExp(L.lessons[first.id as "net"].title) }).click();
  await expect(page.getByText(fill(L.lesson.step, { i: 1, n: 4 }))).toBeVisible();
  for (let i = 0; i < 3; i++) await page.locator("main").getByRole("button", { name: L.lesson.next, exact: true }).click();

  // A wrong answer explains and lets you try again: nothing is lost.
  const check = L.lessons[first.id as "net"].check;
  await page.getByRole("button", { name: exact(option(check, (first.check.correct + 1) % 3)) }).click();
  await page.getByRole("button", { name: L.lesson.tryAgain }).click();
  await page.getByRole("button", { name: exact(option(check, first.check.correct)) }).click();
  await page.getByRole("button", { name: L.lesson.finish }).click();
  await expect(page.getByRole("heading", { name: L.lesson.doneTitle })).toBeVisible();

  // The second lesson of the camp finishes the level: you climb to 1,000 m.
  await page.getByRole("link", { name: L.lesson.nextLesson }).click();
  await expect(page.getByText(L.lessons[second.id as "fixed"].title).first()).toBeVisible();
  for (let i = 0; i < 3; i++) await page.locator("main").getByRole("button", { name: L.lesson.next, exact: true }).click();
  await page.getByRole("button", { name: exact(option(L.lessons[second.id as "fixed"].check, second.check.correct)) }).click();
  await page.getByRole("button", { name: L.lesson.finish }).click();
  await expect(page.locator("main").getByRole("status")).toHaveText(fill(L.lesson.levelUp, { alt: "1,000 m", name: L.levels["2"].name }));
});
