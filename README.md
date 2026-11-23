# Atlas · Ritm

**Try it live: [artificial-inflation-2026.vercel.app](https://artificial-inflation-2026.vercel.app/)**. It's best on a phone; on a laptop it opens inside a phone frame.

A hackathon prototype. Ritm is an opt-in feature inside Atlas, a fictional Romanian banking app, that protects a first salary from being spent too fast after payday.

!(ritm-features.png)

## Demo video

https://github.com/user-attachments/assets/d134387c-5526-47c1-80bd-b7886e4c701b

## The problem

Money disappears fastest in the days right after payday, and banking apps only report spending after it has happened. Young people on their first salary feel it most: no budget yet, rent and bills already taken, and the rest gone before the month is half over.

## What Ritm does

Ritm watches the **pace** of spending since payday: how much of the month's spending money is used compared with how much of the month has passed. The user chooses how strict it is:

- **Heads-up:** a friendly note when spending runs ahead of the month, with a "safe to spend today" amount.
- **Speed bump:** a pause before bigger online payments. It shows what the purchase means for a goal, and paying anyway takes a 2-second hold.
- **Lock:** part of the salary goes aside on payday and opens on a day the user picks. Taking it out early asks why first.

When money is saved, Ritm can also explain Pillar III (a voluntary private pension), always before anything moves and never pre-selected. An "Ask Ritm" chat answers questions in plain words. The app works in Romanian and English.

## The demo

The demo runs on **preset, made-up values**. Nothing is connected to a real bank, and everything you do is stored only in your browser.

| Preset | Value |
| --- | --- |
| Person | Luca, 23, junior QA tester in Cluj-Napoca |
| Net salary | 4,800 lei, paid on day 1 |
| Essentials | 2,180 lei (rent 1,800, utilities 250, phone 50, transport pass 80) |
| Lock | 500 lei, opens on day 20 |
| Spending money | 2,120 lei for the month (salary − essentials − Lock) |
| Goal | A laptop: 3,600 lei in 18 months |
| Live purchase | A 300-lei jacket from ModaHub, a fictional online shop |

The month follows one story: payday and turning Ritm on, a spending spike on day 6 (55% of the money gone), a paused online purchase, the Lock opening on day 20, and payday again on day 30. A second month shows Ritm recognising Luca's usual habits.

**Moving through the month.** A first visit opens a short guide; **Start on payday** begins the story. The demo clock then appears: a day pill in the top bar on a phone, or a panel at the bottom right on a laptop. It lets you:

- step day by day or jump to days 0, 1, 6, 12, 18, 24 and 30
- switch between month 1 and month 2
- simulate any purchase
- **Reset demo** to start again

You can also open the demo clock directly with [`?demo=1`](https://artificial-inflation-2026.vercel.app/?demo=1).

## Run it locally

Requires Node.js 20.9 to 24 (24 recommended). With [nvm](https://github.com/nvm-sh/nvm), `nvm use` picks the right version from `.nvmrc`.

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # unit tests (Vitest)
npm run build
```

"Ask Ritm" uses Gemini when `GEMINI_API_KEY` is set, otherwise Claude when `ANTHROPIC_API_KEY` is set, otherwise built-in answers. To add a key, copy `.env.example` to `.env.local` and fill it in. The rest of the app needs no keys.

**Stack:** Next.js (App Router) + TypeScript, Tailwind CSS, shadcn/ui, Zustand, Motion, Vitest, Playwright.

## Ritm rules

Implemented in `lib/engine`; every threshold lives in `lib/engine/config.ts`.

- Spending money = net salary − essentials − Lock amount.
- Not counted: essential categories, own transfers, refunds, purchases marked planned.
- Pace = % spending money used / % month passed (expected spend floored at day 3).
- Watch ≥ 1.3, spike ≥ 1.6, only after 20% is spent; burst: ≥ 25% in 48 h = spike.
- Run-out forecast: warn if the money runs out ≥ 3 days before payday.
- Safe to spend today = (left + spent today) / days left incl. today − spent today.
- Alerts: only when the level rises or every 48 h; after 2 ignored, suggest the Speed bump.
- Speed bump: online card or in-app payments ≥ 100 lei, non-essential; Pay anyway needs a 2 s hold, then pays at once; off on payday. After "Not now", the sheet offers the Lock, Pillar III or leaving the money in the account. In-store taps get an instant feedback toast instead.
- Lock: opens on the chosen day; early unlock after 24 h; emergency 300 lei once a month; turning Ritm off takes 24 h. At unlock the slider defaults to keeping 100% saved.

## Disclaimer

Atlas, Atlas Pensii, Ritm, Luca, the merchants and all data are fictional. This is a prototype, not a real banking product, and nothing in it is financial, tax or pension advice.

## License

All rights reserved. The code is public to view, but it may not be copied, reused or redistributed without the team's written permission. See [LICENSE](LICENSE).
