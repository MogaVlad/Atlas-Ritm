import { describe, expect, it, vi } from "vitest";
import { askRitm, validateChatRequest, type ChatRequest } from "./askRitm";
import { detectLocale, fallbackAnswer, matchTopic } from "./fallbacks";
import { buildSystemPrompt } from "./systemPrompt";

const ask = (content: string, extra: Partial<ChatRequest> = {}): ChatRequest => ({
  messages: [{ role: "user", content }],
  context: {},
  ...extra,
});

describe("fallbacks", () => {
  it("matches the four topics in Romanian and English", () => {
    expect(matchTopic("Ce este Ritm?")).toBe("ritm");
    expect(matchTopic("What is Ritm?")).toBe("ritm");
    expect(matchTopic("De ce a apărut pauza?")).toBe("pause");
    expect(matchTopic("Why the pause?")).toBe("pause");
    expect(matchTopic("Ce este Pilonul III?")).toBe("pension");
    expect(matchTopic("What is Pillar III?")).toBe("pension");
    expect(matchTopic("Cum deblochez banii?")).toBe("unlock");
    expect(matchTopic("How do I unlock?")).toBe("unlock");
    expect(matchTopic("Cine câștigă meciul?")).toBe("other");
  });

  it("answers in the user's language", () => {
    expect(detectLocale("Ce este Pilonul III?")).toBe("ro");
    expect(detectLocale("What is Pillar III?")).toBe("en");
    expect(fallbackAnswer("What is Pillar III?")).toMatch(/ASF website/);
    expect(fallbackAnswer("Ce este Pilonul III?")).toMatch(/site-ul ASF/);
  });

  it("the pension answer names Atlas Pensii as Atlas's own fund", () => {
    expect(fallbackAnswer("pillar 3?", "en")).toMatch(/Atlas Pensii is Atlas's own fund/);
  });
});

describe("validateChatRequest", () => {
  it("accepts a normal question", () => {
    expect(validateChatRequest({ messages: [{ role: "user", content: "Hi" }], context: {} }).ok).toBe(true);
  });

  it("rejects input longer than 500 characters", () => {
    const r = validateChatRequest({ messages: [{ role: "user", content: "a".repeat(501) }] });
    expect(r).toEqual({ ok: false, error: "message_too_long" });
  });

  it("rejects more than 10 messages", () => {
    const messages = Array.from({ length: 11 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: "x" }));
    expect(validateChatRequest({ messages })).toEqual({ ok: false, error: "too_many_messages" });
  });

  it("rejects empty or malformed bodies", () => {
    expect(validateChatRequest(null).ok).toBe(false);
    expect(validateChatRequest({ messages: [] }).ok).toBe(false);
    expect(validateChatRequest({ messages: [{ role: "system", content: "x" }] }).ok).toBe(false);
  });

  it("keeps only known context fields", () => {
    const r = validateChatRequest({
      messages: [{ role: "user", content: "x" }],
      context: { safeToSpendToday: 0, goal: "Islanda 2027", secret: "nope" },
    });
    expect(r.ok && r.request.context).toEqual({
      safeToSpendToday: 0,
      pctSpent: undefined,
      dayOfCycle: undefined,
      goal: "Islanda 2027",
      purchase: undefined,
    });
  });
});

describe("buildSystemPrompt", () => {
  it("fills CONTEXT with the screen numbers", () => {
    const prompt = buildSystemPrompt({ safeToSpendToday: 0, pctSpent: 0.55, dayOfCycle: 6, goal: "Islanda 2027" });
    expect(prompt).toContain("safeToSpendToday=0 lei; pctSpent=55%; dayOfCycle=6 of 30; goal=Islanda 2027");
    expect(prompt).not.toContain("{context}");
  });
});

describe("askRitm", () => {
  it("works with no API key: answers from the fallbacks", async () => {
    const result = await askRitm(ask("Why the pause?"), { apiKey: undefined });
    expect(result.source).toBe("fallback");
    expect(result.reply).toMatch(/5 seconds/);
  });

  it("falls back when the API call fails", async () => {
    const client = { beta: { messages: { create: vi.fn().mockRejectedValue(new Error("boom")) } } };
    const result = await askRitm(ask("Ce este Ritm?"), { client: client as never });
    expect(result.source).toBe("fallback");
    expect(result.reply).toMatch(/^Ritm urmărește/);
  });

  it("returns Claude's text and sends the limits", async () => {
    const create = vi.fn().mockResolvedValue({
      stop_reason: "end_turn",
      content: [{ type: "text", text: "Pauza te ajută să te gândești." }],
    });
    const result = await askRitm(ask("De ce pauza?", { context: { dayOfCycle: 6 } }), {
      client: { beta: { messages: { create } } } as never,
      model: "claude-opus-5-5",
    });
    expect(result).toEqual({ reply: "Pauza te ajută să te gândești.", source: "claude" });
    const [params, options] = create.mock.calls[0];
    expect(params.max_tokens).toBe(300);
    expect(params.system).toContain("dayOfCycle=6 of 30");
    expect(options.timeout).toBe(8000);
  });

  it("falls back on a refusal", async () => {
    const create = vi.fn().mockResolvedValue({ stop_reason: "refusal", content: [] });
    const result = await askRitm(ask("What is Pillar III?"), { client: { beta: { messages: { create } } } as never });
    expect(result.source).toBe("fallback");
  });
});
