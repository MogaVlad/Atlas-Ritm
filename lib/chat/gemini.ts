import type { ChatMessage } from "./askRitm";

/**
 * "Ask Ritm" on Google's Gemini API (REST, no SDK). Free-tier model by default; override with
 * GEMINI_MODEL. Returns the answer text, or null on any error, block, timeout or empty answer,
 * so the caller falls back to the offline answers.
 */

export const DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export type GeminiOptions = {
  apiKey: string;
  model?: string;
  system: string;
  messages: ChatMessage[];
  maxOutputTokens: number;
  timeoutMs: number;
  /** Tests pass a fake fetch. */
  fetchImpl?: typeof fetch;
};

type GeminiResponse = {
  promptFeedback?: { blockReason?: string };
  candidates?: { finishReason?: string; content?: { parts?: { text?: string }[] } }[];
};

/** Finish reasons that mean the answer was cut or blocked: use the offline answer instead. */
const BAD_FINISH = new Set(["SAFETY", "RECITATION", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII", "OTHER"]);

export async function askGemini(options: GeminiOptions): Promise<string | null> {
  const model = options.model?.trim() || DEFAULT_GEMINI_MODEL;
  const doFetch = options.fetchImpl ?? fetch;

  try {
    const res = await doFetch(`${ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": options.apiKey },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: options.system }] },
        contents: options.messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        generationConfig: { maxOutputTokens: options.maxOutputTokens, temperature: 0.3 },
      }),
      signal: AbortSignal.timeout(options.timeoutMs),
    });
    if (!res.ok) {
      console.warn(`[api/chat] Gemini API error ${res.status}; using fallback`);
      return null;
    }

    const data = (await res.json()) as GeminiResponse;
    if (data.promptFeedback?.blockReason) return null;
    const candidate = data.candidates?.[0];
    if (!candidate || BAD_FINISH.has(candidate.finishReason ?? "")) return null;
    const text = (candidate.content?.parts ?? [])
      .map((p) => p.text ?? "")
      .join("")
      .trim();
    return text || null;
  } catch {
    console.warn("[api/chat] Gemini call failed; using fallback");
    return null;
  }
}
