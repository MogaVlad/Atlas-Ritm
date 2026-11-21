import { expect, test, type Page } from "@playwright/test";
import ro from "../messages/ro.json";

/**
 * The demo journey, end to end, in Romanian at 390×844:
 * payday → onboarding → day 6 Heads-up → turn on Speed bump → ModaHub jacket pauses → paid.
 * Every browser test starts with empty storage, so each test is a fresh demo.
 */

const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
const exact = (text: string) => new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
const starts = (text: string) => new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);

async function jumpToDay(page: Page, day: number) {
  const toggle = page.getByRole("button", { name: /^Demo · ziua \d+$/ });
  await toggle.click();
  const panel = page.getByRole("region", { name: ro.common.demo.title });
  await panel.getByRole("button", { name: String(day), exact: true }).click();
  await expect(page.getByRole("button", { name: `Demo · ziua ${day}` })).toBeVisible();
  await toggle.click(); // close the panel so it doesn't cover the screen
}

async function payForJacket(page: Page) {
  await page.getByRole("link", { name: starts(ro.bank.payments.online) }).click();
  await page.getByRole("link", { name: ro.bank.checkout.payWithAtlas }).click();
  await page.getByRole("button", { name: ro.bank.confirm.confirm }).click();
}

test("payday → onboarding → day 6 Heads-up → Speed bump on the jacket", async ({ page }) => {
  // Day 1: the salary is in. 150 opening + 4.800 salary − 260 spent on day 1.
  await page.goto("/?demo=1");
  await expect(page.getByText("4.690,00 lei")).toBeVisible();

  // Onboarding: keep the defaults (Heads-up, Lock 500 lei until day 20, goal Islanda 2027).
  await page.goto("/ritm?demo=1");
  await expect(page).toHaveURL(/\/ritm\/onboarding/);
  await page.getByRole("button", { name: ro.ritm.onboarding.next }).click();
  await page.getByRole("button", { name: ro.ritm.onboarding.next }).click();
  await page.getByRole("button", { name: ro.ritm.onboarding.finish }).click();

  // Home: the Ritm card shows the Lock, and 500 lei moved from the current account to savings.
  await expect(page).toHaveURL(/localhost:3000\/(\?.*)?$/);
  await expect(page.getByText(fill(ro.ritm.card.lock, { amount: "500,00 lei", day: 20 }))).toBeVisible();
  await expect(page.getByText("4.190,00 lei")).toBeVisible();

  // Day 6: the spike. 1.166 of 2.120 lei gone; Ritm offers a Heads-up.
  await jumpToDay(page, 6);
  await expect(page.getByText("1.104,00 lei")).toBeVisible();
  await page.getByRole("button", { name: ro.ritm.card.headsUpCta }).click();

  const sheet = page.getByRole("dialog");
  await expect(sheet.getByText(ro.ritm.headsUp.title.spike)).toBeVisible();
  await sheet.getByRole("button", { name: starts(ro.ritm.headsUp.actions.enableSpeedBump) }).click();
  await expect(sheet.getByText(ro.ritm.headsUp.done.enableSpeedBump)).toBeVisible();
  await sheet.getByRole("button", { name: ro.ritm.headsUp.close }).first().click();

  // The ModaHub jacket (300 lei, online) now pauses on the Speed bump.
  await page.getByRole("link", { name: exact(ro.bank.nav.payments) }).click();
  await payForJacket(page);
  await expect(page.getByText(ro.ritm.speedBump.title)).toBeVisible();

  // Confirm stays inactive for 5 seconds, then the choice is the user's.
  const countdown = page.getByRole("button", { name: /^Plătesc oricum · \d s$/ });
  await expect(countdown).toBeDisabled();
  const payAnyway = page.getByRole("button", { name: exact(ro.ritm.speedBump.confirm) });
  await expect(payAnyway).toBeEnabled({ timeout: 8_000 });
  await payAnyway.click();
  await expect(page.getByText(ro.bank.confirm.paidTitle)).toBeVisible();

  // Back home: the balance dropped by 300 lei.
  await page.getByRole("link", { name: ro.bank.confirm.backHome }).click();
  await expect(page.getByText("804,00 lei")).toBeVisible();
});

test("with Ritm off, the jacket is paid with no pause", async ({ page }) => {
  await page.goto("/?demo=1");
  await jumpToDay(page, 6);
  await page.getByRole("link", { name: exact(ro.bank.nav.payments) }).click();
  await payForJacket(page);
  await expect(page.getByText(ro.bank.confirm.paidTitle)).toBeVisible();
  await expect(page.getByText(ro.ritm.speedBump.title)).toHaveCount(0);
});
