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

/** Steps the demo clock one day at a time with ›, from `from` (the demo opens on day 0) to `day`. */
async function jumpToDay(page: Page, day: number, from = 1) {
  const clock = page.getByRole("group", { name: m.common.demo.title });
  const next = clock.getByRole("button", { name: m.common.demo.nextDay });
  const label = (d: number) => clock.getByText(fill(m.common.demo.day, { day: d }), { exact: true });
  for (let d = from + 1; d <= day; d++) {
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
  // Day 0, the day before payday: only the 150 lei left from last month.
  await page.goto("/?demo=1");
  await expect(page.getByText("150,00 RON").first()).toBeVisible();

  // Day 1: the salary is in. 150 opening + 4.800 salary − 260 spent on day 1.
  await jumpToDay(page, 1, 0);
  await expect(page.getByText("4.690,00 RON")).toBeVisible();

  // Onboarding: Heads-up is on by default; switch the Lock on (500 lei until day 20). Goal Islanda 2027.
  await page.goto("/ritm?demo=1");
  await expect(page).toHaveURL(/\/ritm\/onboarding/);
  await page.getByRole("button", { name: m.ritm.onboarding.next }).click();
  await page.getByRole("button", { name: m.ritm.onboarding.next }).click();
  await expect(page.getByRole("switch", { name: m.ritm.levels.headsup.name })).toBeChecked();
  await expect(page.getByRole("switch", { name: m.ritm.levels.speedbump.name })).not.toBeChecked();
  await page.getByRole("switch", { name: m.ritm.levels.lock.name }).click();
  await page.getByRole("button", { name: m.ritm.onboarding.finish }).click();

  // Home: the Ritm card shows the Lock, and 500 lei moved from the current account to savings.
  await expect(page).toHaveURL(/localhost:3000\/(\?.*)?$/);
  await expect(page.getByText(fill(m.ritm.card.lock, { amount: "500,00 RON", day: 20 }))).toBeVisible();
  await expect(page.getByText("4.190,00 RON")).toBeVisible();

  // Day 6: the spike. 1.166 of 2.120 lei gone; Ritm offers a Heads-up.
  await jumpToDay(page, 6);
  await expect(page.getByText("1.104,00 RON")).toBeVisible();
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

  // Pay anyway needs a 3-second hold: a short press does nothing, then the choice is the user's.
  const payAnyway = speedBump.getByRole("button", { name: exact(m.ritm.speedBump.confirm) });
  await payAnyway.click();
  await expect(speedBump).toBeVisible();
  await payAnyway.hover();
  await page.mouse.down();
  await page.waitForTimeout(3_500);
  await page.mouse.up();
  await expect(page.getByText(m.bank.confirm.paidTitle)).toBeVisible();

  // Back home: the balance dropped by 300 lei.
  await page.getByRole("link", { name: m.bank.confirm.backHome }).click();
  await expect(page.getByText("804,00 RON")).toBeVisible();
});

test("with Ritm off, the jacket is paid with no pause", async ({ page }) => {
  await page.goto("/?demo=1");
  await jumpToDay(page, 6, 0);
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
  await clock.getByRole("button", { name: fill(m.common.demo.day, { day: 0 }) }).click();
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
  await expect(page.getByText(fill(m.bank.confirm.paidBody, { amount: "120,00 RON", merchant: "FoodGo" }))).toBeVisible();
});

test("goals: several, each with a time; above 20% of the salary Ritm explains, then they can be edited", async ({ page }) => {
  const g = m.ritm.goals;
  const s3 = m.ritm.onboarding.s3;
  await page.goto("/ritm?demo=1");
  await page.getByRole("button", { name: m.ritm.onboarding.next }).click();
  await page.getByRole("button", { name: m.ritm.onboarding.next }).click();

  // Islanda 2027: 9.000 lei in 18 months = 500 lei a month, 10% of the 4.800 lei salary.
  await expect(page.getByText(fill(g.total, { amount: "500,00 RON", pct: 10 }))).toBeVisible();
  await expect(page.getByText(g.within)).toBeVisible();

  // A laptop for 6.000 lei in 12 months adds 500 lei a month: 1.000 lei is 21%, above the guideline.
  await page.getByRole("button", { name: g.add }).click();
  await page.getByLabel(s3.goalName).nth(1).fill("Laptop");
  await page.getByLabel(s3.goalAmount).nth(1).fill("6000");
  await expect(page.getByText(fill(g.total, { amount: "1.000,00 RON", pct: 21 }))).toBeVisible();
  await expect(page.getByText(fill(g.over, { guideline: "960,00 RON" }))).toBeVisible();

  // It explains, it doesn't block: Ritm starts with both goals.
  await page.getByRole("button", { name: m.ritm.onboarding.finish }).click();
  await page.getByRole("link", { name: exact(m.bank.nav.ritm) }).click();
  await expect(page.getByText(fill(g.totalValue, { amount: "1.000,00 RON", pct: 21 }))).toBeVisible();

  // Later: give the laptop 24 months and it fits in the 20% again.
  await page.getByRole("link", { name: g.editLink }).click();
  await page.getByLabel(g.reachIn).nth(1).fill("24");
  await expect(page.getByText(g.within)).toBeVisible();
  await page.getByRole("button", { name: g.save }).click();
  await expect(page.getByText(fill(g.totalValue, { amount: "750,00 RON", pct: 16 }))).toBeVisible();
});

test("after the money goes to Pillar III, the done screen counts down to Home and back doesn't reopen the payment", async ({ page }) => {
  await page.goto("/?demo=1");
  await jumpToDay(page, 1, 0);

  // Start Ritm with the Speed bump switched on.
  await page.getByRole("link", { name: exact(m.bank.nav.ritm) }).click();
  await page.getByRole("button", { name: m.ritm.onboarding.next }).click();
  await page.getByRole("button", { name: m.ritm.onboarding.next }).click();
  await page.getByRole("switch", { name: m.ritm.levels.speedbump.name }).click();
  await page.getByRole("button", { name: m.ritm.onboarding.finish }).click();

  // The jacket pauses; the 300 lei go to Atlas Pensii instead.
  await page.getByRole("link", { name: exact(m.bank.nav.payments) }).click();
  await payForJacket(page);
  const speedBump = page.getByRole("dialog", { name: m.ritm.speedBump.title });
  await speedBump.getByRole("button", { name: starts(m.ritm.speedBump.pension) }).click();
  // The explainer is 3 short steps: what it is → what you get → the catch (with the checkbox).
  await page.getByRole("button", { name: m.ritm.pension.next, exact: true }).click();
  await expect(page.getByText(fill(m.ritm.pension.getBig, { tax: "30,00 RON" }), { exact: true })).toBeVisible();
  await page.getByRole("button", { name: m.ritm.pension.next, exact: true }).click();
  await page.getByRole("checkbox", { name: m.ritm.pension.consent }).check();
  await page.getByRole("button", { name: starts(fill(m.ritm.pension.contribute, { amount: "" })) }).click();

  // The done screen confirms the transfer, counts down, and takes you Home by itself.
  const done = page.getByRole("dialog", { name: fill(m.bank.pensionDone.title, { amount: "300,00 RON" }) });
  await expect(done).toBeVisible();
  await expect(done.getByRole("button", { name: m.bank.pensionDone.stay })).toBeVisible();
  await expect(page).toHaveURL(/localhost:3000\/(\?.*)?$/, { timeout: 8_000 });
  await page.goBack();
  await expect(page).not.toHaveURL(/\/payments\/confirm/);
});

test("Lock: shown as on, and taking money out asks why with buttons (Health = now, Something I want = 24 h)", async ({ page }) => {
  const lock = m.ritm.lock;
  await page.goto("/?demo=1");
  await jumpToDay(page, 1, 0);

  // Step 1 of onboarding has a Back: it leaves the way you came in.
  await page.getByRole("link", { name: exact(m.bank.nav.ritm) }).click();
  await page.getByRole("button", { name: exact(m.ritm.onboarding.back) }).click();
  await expect(page).not.toHaveURL(/\/ritm\/onboarding/);

  // Start Ritm with the Lock on.
  await page.getByRole("link", { name: exact(m.bank.nav.ritm) }).click();
  await page.getByRole("button", { name: m.ritm.onboarding.next }).click();
  await page.getByRole("button", { name: m.ritm.onboarding.next }).click();
  await page.getByRole("switch", { name: m.ritm.levels.lock.name }).click();
  await page.getByRole("button", { name: m.ritm.onboarding.finish }).click();

  // The Ritm tab shows the Lock as on, and opens it.
  await page.getByRole("link", { name: exact(m.bank.nav.ritm) }).click();
  const lockRow = page.getByRole("link", { name: new RegExp(`^${m.ritm.levels.lock.name}.*${m.ritm.features.on}`) });
  await expect(lockRow).toBeVisible();
  await lockRow.click();

  // The mirror: pick a reason from the buttons, see the facts, then decide.
  await page.getByRole("radio", { name: lock.reason.health }).click();
  await expect(page.getByText(lock.firstUnlock, { exact: false })).toBeVisible();
  await page.getByRole("button", { name: starts(lock.emergencyConfirm.split("{")[0]) }).click();
  await expect(page.getByText(fill(lock.emergencyDone, { amount: "300,00 RON" }))).toBeVisible();

  // "Something I want" is never refused: it waits 24 hours.
  await page.getByRole("radio", { name: lock.reason.want }).click();
  await page.getByRole("button", { name: lock.earlyConfirm }).click();
  await expect(page.getByText(fill(lock.requested, { amount: "200,00 RON", day: 2 }))).toBeVisible();
});

test("the Lock opening pops up once and leads to the choice; Reset demo goes back Home", async ({ page }) => {
  await page.goto("/?demo=1");
  await jumpToDay(page, 1, 0);

  // Start Ritm with the Lock on (500 lei until day 20).
  await page.getByRole("link", { name: exact(m.bank.nav.ritm) }).click();
  await page.getByRole("button", { name: m.ritm.onboarding.next }).click();
  await page.getByRole("button", { name: m.ritm.onboarding.next }).click();
  await page.getByRole("switch", { name: m.ritm.levels.lock.name }).click();
  await page.getByRole("button", { name: m.ritm.onboarding.finish }).click();

  // Day 20: the popup says the Lock is open and leads to the unlock screen.
  const clock = page.getByRole("group", { name: m.common.demo.title });
  await clock.getByRole("button", { name: fill(m.common.demo.day, { day: 1 }) }).click();
  const panel = page.getByRole("region", { name: m.common.demo.buy.button });
  await panel.getByRole("button", { name: fill(m.common.demo.jumpTo, { day: 18 }) }).click();
  await panel.getByRole("button", { name: m.common.demo.buy.close }).click();
  await jumpToDay(page, 20, 18);
  const popup = page.getByRole("dialog", { name: m.common.lockPrompt.title });
  await expect(popup).toBeVisible();
  await popup.getByRole("button", { name: m.common.lockPrompt.open }).click();
  await expect(page).toHaveURL(/\/ritm\/unlock/);
  await expect(page.getByRole("dialog", { name: m.common.lockPrompt.title })).toHaveCount(0);

  // Reset demo from any screen lands on Home, day 0.
  await clock.getByRole("button", { name: fill(m.common.demo.day, { day: 20 }) }).click();
  await panel.getByRole("button", { name: m.common.demo.reset }).click();
  await expect(page).toHaveURL(/localhost:3000\/(\?.*)?$/);
  await expect(clock.getByText(fill(m.common.demo.day, { day: 0 }), { exact: true })).toBeVisible();
});

test("month 2: Ritm knows the habits, day 6 brings the soft note, the summary remembers last month", async ({ page }) => {
  const clock = page.getByRole("group", { name: m.common.demo.title });
  await page.goto("/?demo=1");
  await jumpToDay(page, 1, 0);

  // Start Ritm with the Lock on, then switch the demo to month 2 (back to day 0).
  await page.getByRole("link", { name: exact(m.bank.nav.ritm) }).click();
  await page.getByRole("button", { name: m.ritm.onboarding.next }).click();
  await page.getByRole("button", { name: m.ritm.onboarding.next }).click();
  await page.getByRole("switch", { name: m.ritm.levels.lock.name }).click();
  await page.getByRole("button", { name: m.ritm.onboarding.finish }).click();
  await clock.getByRole("button", { name: fill(m.common.demo.day, { day: 1 }) }).click();
  await page.getByRole("button", { name: fill(m.common.demo.month, { n: 2 }) }).click();
  await expect(clock.getByText(fill(m.common.demo.day, { day: 0 }), { exact: true })).toBeVisible();

  // Day 6: his habits came more often, but the money lasts: the soft note, no push.
  await jumpToDay(page, 6, 0);
  await page.getByRole("button", { name: m.ritm.card.headsUpCta }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByText(m.ritm.headsUp.habit.title)).toBeVisible();
  await expect(sheet.getByText(starts(m.ritm.headsUp.habit.body.split("{")[0]))).toBeVisible();
  await expect(sheet.getByText(m.ritm.headsUp.intro)).toHaveCount(0);
  await sheet.getByRole("button", { name: m.ritm.headsUp.habit.ok }).click();

  // The summary compares with last month and brings back last month's "Something I want".
  await page.goto("/ritm/summary?demo=1");
  await expect(page.getByText(m.ritm.summary.lastTitle)).toBeVisible();
  await expect(page.getByText(starts(m.ritm.summary.want.lastOne.split("{")[0].split("“")[0]))).toBeVisible();
});

test("the Speed bump shows one number per choice; lowering the Lock asks why", async ({ page }) => {
  await page.goto("/?demo=1");
  await jumpToDay(page, 1, 0);
  await page.getByRole("link", { name: exact(m.bank.nav.ritm) }).click();
  await page.getByRole("button", { name: m.ritm.onboarding.next }).click();
  await page.getByRole("button", { name: m.ritm.onboarding.next }).click();
  await page.getByRole("switch", { name: m.ritm.levels.speedbump.name }).click();
  await page.getByRole("switch", { name: m.ritm.levels.lock.name }).click();
  await page.getByRole("button", { name: m.ritm.onboarding.finish }).click();

  // Speed bump: each option says what it gives, in RON.
  await page.getByRole("link", { name: exact(m.bank.nav.payments) }).click();
  await payForJacket(page);
  const speedBump = page.getByRole("dialog", { name: m.ritm.speedBump.title });
  // Day 1: today's share is already used, so "Not now" says it keeps the month on track.
  await expect(speedBump.getByText(m.ritm.speedBump.notNowHintUsed)).toBeVisible();
  await expect(speedBump.getByText(starts(m.ritm.speedBump.pensionNumber.split("{")[0]))).toBeVisible();
  await speedBump.getByRole("button", { name: m.ritm.speedBump.notNow }).click();

  // Lock screen: a lower Lock goes through the reason buttons.
  await page.goto("/ritm/lock?demo=1");
  await page.getByRole("button", { name: starts(m.ritm.lock.changeTitle) }).click();
  const amount = page.getByRole("slider", { name: m.ritm.onboarding.s3.lockAmount });
  await amount.focus();
  for (let i = 0; i < 4; i++) await amount.press("ArrowLeft"); // 500 → 300
  await page.getByRole("button", { name: m.ritm.lock.changeSave }).click();
  await expect(page.getByText(fill(m.ritm.lock.lowerExplain, { amount: "200,00 RON" }))).toBeVisible();
  const change = page.getByRole("region", { name: m.ritm.lock.changeTitle });
  await change.getByRole("radio", { name: m.ritm.lock.reason.want }).click();
  await page.getByRole("button", { name: fill(m.ritm.lock.lowerConfirm, { amount: "200,00 RON" }) }).click();
  await expect(page.getByText(fill(m.ritm.lock.requested, { amount: "200,00 RON", day: 2 }))).toBeVisible();
});
