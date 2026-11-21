# Atlas · Ritm (hackathon prototype)

## What we're building
Atlas is a FICTIONAL Romanian bank, shown as a mobile web app (390×844).
Ritm is an opt-in Atlas feature for young people on their first salary: it watches the
pace of spending since payday and, at the level the user chooses, warns (Heads-up),
pauses online payments (Speed bump) or locks part of the salary in savings (Lock).
Pillar III (Atlas Pensii) is offered in the Speed bump and at Lock unlock, always
explained first and never as a default.

## Stack
Next.js App Router + TypeScript, Tailwind, shadcn/ui, Zustand (persist), motion,
Vitest, Playwright. Deployed on Vercel from `main`.

## Folder ownership (do not edit another person's folders; ask in chat)
- Cosma: lib/, app/api/, CLAUDE.md
- Horia: app/ritm/, components/ritm/
- Iustin: app/(bank)/, components/bank/
- Shared: components/ui (shadcn CLI only), messages/*.json (own namespace only)

## Code rules
- Every visible text uses useT('namespace.key') from lib/i18n.ts. Add each key to BOTH
  messages/ro.json and messages/en.json. Namespaces: common.*, bank.*, ritm.*. No hardcoded text.
- Money: formatLei(amount, locale) from lib/format.ts. Same format in both languages
  (team decision): 1.234,56 lei.
- Mobile first: design at 390×844; touch targets at least 44px; visible focus states;
  respect prefers-reduced-motion.
- Fictional merchants and brands only. Never use real bank names, logos or brand colours.
- All bank data is synthetic (lib/data). The only external call is /api/chat.
- Domain logic lives ONLY in lib/engine. Components call it; they never re-implement rules.
- Before saying a task is done: npm run build, npm test, and look at the screen with
  Playwright at 390×844. Fix what looks broken.

## Ritm rules (implemented in lib/engine; change numbers only there)
- Spending money = net salary - essentials - Lock amount.
- Not counted: essential categories, own transfers, refunds, purchases marked planned.
- Pace = % spending money used / % month passed (expected spend floored at day 3).
- watch >= 1.3, spike >= 1.6, only after 20% is spent; burst: >= 25% in 48h = spike.
- Run-out forecast: warn if money runs out >= 3 days before payday.
- Safe to spend today = (left + spent today) / days left incl. today - spent today.
- Alerts: only when the level rises or every 48h; after 2 ignored, suggest Speed bump.
- Speed bump: online card or in-app payments >= 100 lei, non-essential; Confirm active after
  5 s; off on payday. In-store taps: instant feedback toast instead.
- Lock: auto-unlock on chosen day; early unlock after 24h; emergency 300 lei once a month;
  turning Ritm off takes 24h. At unlock the slider defaults to keep 100% saved.

## Tone and ethics
Friendly, short, never shaming. Explain before any action that moves money, with the
trade-off in one sentence. Pension: never pre-selected, needs a checkbox + explicit button,
says Atlas Pensii is Atlas's own fund and that funds can be compared on the ASF website.
No fake urgency.

## Demo
Demo controls appear with ?demo=1: day slider, jumps to day 1/6/20/30, Reset demo.

## Roadmap
The full plan is in docs/ROADMAP.md. When I give you a task code (C1, H2, I3...),
read that task's prompt in section 6 and its context in sections 1 and 4 before starting.
