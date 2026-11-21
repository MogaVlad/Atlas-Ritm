import { expect, test, type Page } from "@playwright/test";
import m from "../messages/en.json";

/**
 * The demo journey, end to end, in English (the default language) at 390×844:
 * payday → onboarding → day 6 Heads-up → turn on Speed bump → ModaHub jacket pauses → paid.
 * Every browser test starts with empty storage, so each test is a fresh demo.
 */

const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
const exact = (text: string) => new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
const starts = (text: string) => new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);

async function jumpToDay(page: Page, day: number) {
  const clock = page.getByRole("group", { name: m.common.demo.title });
  const next = clock.getByRole("button", { name: m.common.demo.nextDay });
  const label = (d: number) => clock.getByText(fill(m.common.demo.day, { day: d }), { exact: true });
  for (let d = 2; d <= day; d++) {
    await next.click();
    await expect(label(d)).toBeVisible();
  }
}

async function payForJacket(page: Page) {
  await page.getByRole("link", { name: starts(m.bank.payments.online) }).click();
  await page.getByRole("link", { name: m.bank.checkout.payWithAtlas }).click();
  await page.getByRole("button", { name: m.bank.confirm.confirm }).click();
}

test("payday → onboarding → day 6 Heads-up → Speed bump on the jacket", async ({ page }) => {
  // Day 1: the salary is in. 150 opening + 4.800 salary − 260 spent on day 1.
  await page.goto("/?demo=1");
  await expect(page.getByText("4.690,00 lei")).toBeVisible();

  // Onboarding: keep the defaults (Heads-up, Lock 500 lei until day 20, goal Islanda 2027).
  await page.goto("/ritm?demo=1");
  await expect(page).toHaveURL(/\/ritm\/onboarding/);
  await page.getByRole("button", { name: m.ritm.onboarding.next }).click();
  await page.getByRole("button", { name: m.ritm.onboarding.next }).click();
  await page.getByRole("button", { name: m.ritm.onboarding.finish }).click();

  // Home: the Ritm card shows the Lock, and 500 lei moved from the current account to savings.
  await expect(page).toHaveURL(/localhost:3000\/(\?.*)?$/);
  await expect(page.getByText(fill(m.ritm.card.lock, { amount: "500,00 lei", day: 20 }))).toBeVisible();
  await expect(page.getByText("4.190,00 lei")).toBeVisible();

  // Day 6: the spike. 1.166 of 2.120 lei gone; Ritm offers a Heads-up.
  await jumpToDay(page, 6);
  await expect(page.getByText("1.104,00 lei")).toBeVisible();
  await page.getByRole("button", { name: m.ritm.card.headsUpCta }).click();

  const sheet = page.getByRole("dialog");
  await expect(sheet.getByText(m.ritm.headsUp.title.spike)).toBeVisible();
  await sheet.getByRole("button", { name: starts(m.ritm.headsUp.actions.enableSpeedBump) }).click();
  await expect(sheet.getByText(m.ritm.headsUp.done.enableSpeedBump)).toBeVisible();
  await sheet.getByRole("button", { name: m.ritm.headsUp.close }).first().click();

  // The ModaHub jacket (300 lei, online) now pauses on the Speed bump.
  await page.getByRole("link", { name: exact(m.bank.nav.payments) }).click();
  await payForJacket(page);
  const speedBump = page.getByRole("dialog", { name: m.ritm.speedBump.title });
  await expect(speedBump).toBeVisible();

  // Confirm stays inactive for 5 seconds, then the choice is the user's.
  const countdown = speedBump.getByRole("button", { name: /^Pay anyway · \d s$/ });
  await expect(countdown).toBeDisabled();
  const payAnyway = speedBump.getByRole("button", { name: exact(m.ritm.speedBump.confirm) });
  await expect(payAnyway).toBeEnabled({ timeout: 8_000 });
  await payAnyway.click();
  await expect(page.getByText(m.bank.confirm.paidTitle)).toBeVisible();

  // Back home: the balance dropped by 300 lei.
  await page.getByRole("link", { name: m.bank.confirm.backHome }).click();
  await expect(page.getByText("804,00 lei")).toBeVisible();
});

test("with Ritm off, the jacket is paid with no pause", async ({ page }) => {
  await page.goto("/?demo=1");
  await jumpToDay(page, 6);
  await page.getByRole("link", { name: exact(m.bank.nav.payments) }).click();
  await payForJacket(page);
  await expect(page.getByText(m.bank.confirm.paidTitle)).toBeVisible();
  await expect(page.getByRole("dialog", { name: m.ritm.speedBump.title })).toHaveCount(0);
});

test("demo tools: jump to a day, simulate any purchase, never below zero", async ({ page }) => {
  const buy = m.common.demo.buy;
  await page.goto("/?demo=1");
  // On a phone, tapping the day opens the demo tools; the jumps live in the panel.
  const clock = page.getByRole("group", { name: m.common.demo.title });
  await clock.getByRole("button", { name: fill(m.common.demo.day, { day: 1 }) }).click();
  const panel = page.getByRole("region", { name: buy.button });
  await panel.getByRole("button", { name: fill(m.common.demo.jumpTo, { day: 12 }) }).click();
  await expect(clock.getByText(fill(m.common.demo.day, { day: 12 }), { exact: true })).toBeVisible();

  // More than the current account holds: refused, nothing paid.
  const payButton = panel.getByRole("button", { name: starts(fill(buy.pay, { amount: "" })) });
  await panel.getByLabel(buy.amount).fill("99999");
  await panel.getByRole("radio", { name: buy.inStore }).click();
  await payButton.click();
  await expect(panel.getByText(starts(m.bank.payments.insufficient.split("{")[0]))).toBeVisible();

  // Online, 120 lei at FoodGo: Atlas asks to approve that purchase, not the jacket.
  await panel.getByLabel(buy.shop, { exact: true }).selectOption({ label: "FoodGo" });
  await panel.getByLabel(buy.amount).fill("120");
  await panel.getByRole("radio", { name: buy.online }).click();
  await payButton.click();
  await expect(page).toHaveURL(/\/payments\/confirm/);
  await page.getByRole("button", { name: m.bank.confirm.confirm }).click();
  await expect(page.getByText(fill(m.bank.confirm.paidBody, { amount: "120,00 lei", merchant: "FoodGo" }))).toBeVisible();
});

test("goals: several, each with a time; above 20% of the salary Ritm explains, then they can be edited", async ({ page }) => {
  const g = m.ritm.goals;
  const s3 = m.ritm.onboarding.s3;
  await page.goto("/ritm?demo=1");
  await page.getByRole("button", { name: m.ritm.onboarding.next }).click();
  await page.getByRole("button", { name: m.ritm.onboarding.next }).click();

  // Islanda 2027: 9.000 lei in 18 months = 500 lei a month, 10% of the 4.800 lei salary.
  await expect(page.getByText(fill(g.total, { amount: "500,00 lei", pct: 10 }))).toBeVisible();
  await expect(page.getByText(g.within)).toBeVisible();

  // A laptop for 6.000 lei in 12 months adds 500 lei a month: 1.000 lei is 21%, above the guideline.
  await page.getByRole("button", { name: g.add }).click();
  await page.getByLabel(s3.goalName).nth(1).fill("Laptop");
  await page.getByLabel(s3.goalAmount).nth(1).fill("6000");
  await expect(page.getByText(fill(g.total, { amount: "1.000,00 lei", pct: 21 }))).toBeVisible();
  await expect(page.getByText(fill(g.over, { guideline: "960,00 lei" }))).toBeVisible();

  // It explains, it doesn't block: Ritm starts with both goals.
  await page.getByRole("button", { name: m.ritm.onboarding.finish }).click();
  await page.getByRole("link", { name: exact(m.bank.nav.ritm) }).click();
  await expect(page.getByText(fill(g.totalValue, { amount: "1.000,00 lei", pct: 21 }))).toBeVisible();

  // Later: give the laptop 24 months and it fits in the 20% again.
  await page.getByRole("link", { name: g.editLink }).click();
  await page.getByLabel(g.reachIn).nth(1).fill("24");
  await expect(page.getByText(g.within)).toBeVisible();
  await page.getByRole("button", { name: g.save }).click();
  await expect(page.getByText(fill(g.totalValue, { amount: "750,00 lei", pct: 16 }))).toBeVisible();
});
