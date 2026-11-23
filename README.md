# Atlas · Ritm

Hackathon prototype: Ritm, an opt-in feature in Atlas (a fictional Romanian bank) that protects a first salary from fast spending after payday.

Atlas is shown as a mobile web app (390×844). Ritm watches the pace of spending since payday and, at the level the user chooses, warns (Heads-up), pauses online payments (Speed bump) or locks part of the salary in savings (Lock). Pillar III (Atlas Pensii) is offered in the Speed bump and at Lock unlock, always explained first and never as a default.

All bank data, merchants and brands are fictional and synthetic.

## Stack

Next.js App Router + TypeScript, Tailwind, shadcn/ui, Zustand (persist), motion, Vitest, Playwright.

## Run locally

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # Vitest
npm run build
```

Demo controls appear with `?demo=1`: day slider, jumps to day 1/6/20/30, Reset demo.

"Ask Ritm" (`/api/chat`) uses Gemini when `GEMINI_API_KEY` is set, otherwise Claude when `ANTHROPIC_API_KEY` is set, otherwise canned answers.

## Ritm rules

Implemented in `lib/engine`; thresholds live in `lib/engine/config.ts`.

- Spending money = net salary − essentials − Lock amount.
- Not counted: essential categories, own transfers, refunds, purchases marked planned.
- Pace = % spending money used / % month passed (expected spend floored at day 3).
- Watch ≥ 1.3, spike ≥ 1.6, only after 20% is spent; burst: ≥ 25% in 48h = spike.
- Run-out forecast: warn if money runs out ≥ 3 days before payday.
- Safe to spend today = (left + spent today) / days left incl. today − spent today.
- Alerts: only when the level rises or every 48h; after 2 ignored, suggest Speed bump.
- Speed bump: online card or in-app payments ≥ 100 lei, non-essential; Pay anyway needs a 2 s hold, then pays at once; off on payday. After "Not now", the sheet offers Lock, Pillar III or leaving it in the account. In-store taps get an instant feedback toast instead.
- Lock: auto-unlock on the chosen day; early unlock after 24h; emergency 300 lei once a month; turning Ritm off takes 24h. At unlock the slider defaults to keep 100% saved.
