import { askRitm, validateChatRequest } from "@/lib/chat/askRitm";

/**
 * "Ask Ritm". POST { messages, context } → { reply, source }.
 * Keys and models come from server env only and never reach the browser:
 * GEMINI_API_KEY (+ optional GEMINI_MODEL, default a free-tier Flash-Lite) is used first,
 * then ANTHROPIC_API_KEY (+ ANTHROPIC_MODEL).
 * Without a key, on any error or after 8 s it answers from lib/chat/fallbacks.ts.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const checked = validateChatRequest(body);
  if (!checked.ok) return Response.json({ error: checked.error }, { status: 400 });

  const result = await askRitm(checked.request, {
    geminiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL,
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL,
  });
  return Response.json(result);
}
