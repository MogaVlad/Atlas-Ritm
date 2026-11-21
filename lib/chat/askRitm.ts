import Anthropic from "@anthropic-ai/sdk";
import { detectLocale, fallbackAnswer, type ChatLocale } from "./fallbacks";
import { buildSystemPrompt, sanitizeContext, type ChatContext } from "./systemPrompt";

/** Server-side "Ask Ritm" logic. app/api/chat/route.ts is a thin wrapper around this. */

export const CHAT_LIMITS = {
  maxMessages: 10,
  maxChars: 500,
  timeoutMs: 8000,
  maxTokens: 300,
} as const;

const DEFAULT_MODEL = "claude-opus-5-5";

/** Models that accept the server-side refusal fallback (`fallbacks: "default"`). */
const FALLBACK_MODELS = new Set([
  "claude-opus-5-5",
  "claude-opus-5",
  "claude-sonnet-5-5",
  "claude-fable-5-1",
  "claude-fable-5-2",
]);

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ChatRequest = {
  messages: ChatMessage[];
  context: ChatContext;
  locale?: ChatLocale;
};

export type ChatReply = { reply: string; source: "claude" | "fallback" };

export type Validation = { ok: true; request: ChatRequest } | { ok: false; error: string };

/** Checks the POST body: 1–10 messages, each at most 500 characters, the last one from the user. */
export function validateChatRequest(body: unknown): Validation {
  if (!body || typeof body !== "object") return { ok: false, error: "invalid_body" };
  const { messages, context, locale } = body as Record<string, unknown>;

  if (!Array.isArray(messages) || messages.length === 0) return { ok: false, error: "no_messages" };
  if (messages.length > CHAT_LIMITS.maxMessages) return { ok: false, error: "too_many_messages" };

  const clean: ChatMessage[] = [];
  for (const m of messages) {
    const { role, content } = (m ?? {}) as Record<string, unknown>;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string" || !content.trim()) {
      return { ok: false, error: "invalid_message" };
    }
    if (content.length > CHAT_LIMITS.maxChars) return { ok: false, error: "message_too_long" };
    clean.push({ role, content });
  }
  if (clean[0].role !== "user" || clean[clean.length - 1].role !== "user") {
    return { ok: false, error: "invalid_message" };
  }

  return {
    ok: true,
    request: {
      messages: clean,
      context: sanitizeContext(context),
      locale: locale === "ro" || locale === "en" ? locale : undefined,
    },
  };
}

export type AskOptions = {
  apiKey?: string;
  model?: string;
  /** Tests pass a fake client; the real one is built from apiKey. */
  client?: Pick<Anthropic, "beta">;
};

/** Asks Claude; on a missing key, any error, a timeout or an empty answer, returns the offline answer. */
export async function askRitm(request: ChatRequest, options: AskOptions = {}): Promise<ChatReply> {
  const question = request.messages[request.messages.length - 1].content;
  const fallback = (): ChatReply => ({
    reply: fallbackAnswer(question, detectLocale(question, request.locale ?? "ro")),
    source: "fallback",
  });

  const apiKey = options.apiKey?.trim();
  if (!options.client && !apiKey) return fallback();

  const model = options.model?.trim() || DEFAULT_MODEL;
  const client =
    options.client ?? new Anthropic({ apiKey, timeout: CHAT_LIMITS.timeoutMs, maxRetries: 0 });

  try {
    const response = await client.beta.messages.create(
      {
        model,
        max_tokens: CHAT_LIMITS.maxTokens,
        system: buildSystemPrompt(request.context),
        messages: request.messages,
        // Short, simple answers: low effort keeps them fast and cheap.
        output_config: { effort: "low" },
        // If a safety check declines, the API retries on a fallback model in the same call.
        ...(FALLBACK_MODELS.has(model)
          ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
          : {}),
      },
      { timeout: CHAT_LIMITS.timeoutMs, signal: AbortSignal.timeout(CHAT_LIMITS.timeoutMs) },
    );

    if (response.stop_reason === "refusal") return fallback();
    const text = response.content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join("")
      .trim();
    return text ? { reply: text, source: "claude" } : fallback();
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.warn(`[api/chat] Claude API error ${error.status ?? "network"}; using fallback`);
    } else {
      console.warn("[api/chat] Claude call failed; using fallback");
    }
    return fallback();
  }
}
