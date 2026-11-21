import { askRitm, validateChatRequest } from "@/lib/chat/askRitm";

/**
 * "Ask Ritm" (task C6). POST { messages, context } → { reply, source }.
 * The key and model come from server env only (ANTHROPIC_API_KEY, ANTHROPIC_MODEL) and never reach the browser.
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
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL,
  });
  return Response.json(result);
}
