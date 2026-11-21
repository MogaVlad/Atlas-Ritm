/**
 * The instructions for "Ask Ritm" (roadmap section 2).
 * The screen numbers are filled into CONTEXT on every request, server side.
 */

/** What the chat sheet sends with each question (task I4). Every field is optional. */
export type ChatContext = {
  safeToSpendToday?: number;
  pctSpent?: number;
  dayOfCycle?: number;
  goal?: string;
  purchase?: string;
};

const SYSTEM_PROMPT = `You are "Ask Ritm", the helper inside the Atlas banking app (a hackathon prototype).
You ONLY explain: how Ritm works (Heads-up, Speed bump, Lock), the numbers on the user's
screen (given in CONTEXT), and general facts about Romanian savings options and Pillar III
(given in FACTS).
Rules:
- Reply in the user's language (Romanian or English), at most 3 short sentences.
- Never tell the user to buy or not to buy something. Explain the trade-off and say the
  choice is theirs.
- Never recommend a specific investment or fund. Never promise or estimate returns.
- If asked about Atlas Pensii, say it is Atlas's own fund and that other funds can be
  compared on the ASF website.
- If the question is outside these topics, say you can only help with Ritm and the money
  in this app.
FACTS: Pillar III is a voluntary private pension; money stays invested until retirement;
contributions are deductible up to the RON equivalent of 400 EUR a year (shared with
private health insurance). Interest on bank savings is taxed at 10%.
CONTEXT: {context}`;

const MAX_TEXT = 80;

function num(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function text(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const clean = value.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT);
  return clean || undefined;
}

/** Keeps only known fields, numbers as numbers and short single-line strings. */
export function sanitizeContext(raw: unknown): ChatContext {
  const c = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    safeToSpendToday: num(c.safeToSpendToday),
    pctSpent: num(c.pctSpent),
    dayOfCycle: num(c.dayOfCycle),
    goal: text(c.goal),
    purchase: text(c.purchase),
  };
}

/** The system prompt with CONTEXT filled in. Missing values are written as "unknown". */
export function buildSystemPrompt(context: ChatContext): string {
  const show = (v: string | number | undefined) => (v === undefined ? "unknown" : String(v));
  // The engine gives a fraction (0.55); accept 55 too, in case the screen sends a percent.
  const p = context.pctSpent;
  const pct = p === undefined ? "unknown" : `${Math.round(p > 1.5 ? p : p * 100)}%`;
  const line = [
    `safeToSpendToday=${show(context.safeToSpendToday)} RON`,
    `pctSpent=${pct}`,
    `dayOfCycle=${show(context.dayOfCycle)} of 30`,
    `goal=${show(context.goal)}`,
    `purchase=${show(context.purchase)}`,
  ].join("; ");
  return SYSTEM_PROMPT.replace("{context}", line);
}
