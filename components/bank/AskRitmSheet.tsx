"use client";

import { ArrowUp, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { ChatMessage, ChatReply } from "@/lib/chat/askRitm";
import { formatLei } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { useBank } from "@/lib/store/useBank";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "./useFocusTrap";

/** Same limits as CHAT_LIMITS in lib/chat/askRitm.ts (not imported: that file pulls the SDK into the browser). */
const MAX_CHARS = 500;
const MAX_MESSAGES = 10;
/** The server answers from its fallbacks after 8 s; this only catches a dead connection. */
const CLIENT_TIMEOUT_MS = 15_000;

const SUGGESTIONS = ["pillar", "pause"] as const;

type Message = ChatMessage & { id: string; source?: ChatReply["source"]; failed?: boolean };

let nextId = 0;
const newId = () => `m${++nextId}`;

/** What the server may see: answered turns only, at most 10, starting with a question. */
function toHistory(list: Message[]): ChatMessage[] {
  const history = list.filter((m) => !m.failed).map(({ role, content }) => ({ role, content }));
  const recent = history.slice(-MAX_MESSAGES);
  while (recent.length > 0 && recent[0].role !== "user") recent.shift();
  return recent;
}

/**
 * "Ask Ritm", opened from the Speed bump. Explains Ritm, the numbers on screen and the options;
 * never decides for the user (the server's system prompt enforces it, the footer says it).
 */
export function AskRitmSheet({
  purchase,
  onClose,
}: {
  /** The paused payment, sent as context so answers can refer to it. */
  purchase?: { merchant: string; amount: number };
  onClose: () => void;
}) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const reduce = useReducedMotion();
  const titleId = useId();
  const inputId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const dialog = useRef<HTMLElement>(null);
  // Before the effect that focuses the heading, so the trap remembers the "Ask Ritm" button.
  useFocusTrap(dialog);
  const end = useRef<HTMLDivElement>(null);
  const inFlight = useRef<AbortController | null>(null);

  const pace = useBank((s) => s.pace);
  // Every goal's name, so Ask Ritm can talk about any of them.
  const goal = useBank((s) => s.ritm.goals.map((g) => g.name).join(", "));

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    heading.current?.focus();
    return () => inFlight.current?.abort();
  }, []);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end", behavior: reduce ? "auto" : "smooth" });
  }, [messages, pending, reduce]);

  async function ask(question: string, previous: Message[]) {
    const text = question.trim().slice(0, MAX_CHARS);
    if (!text || pending) return;

    const mine: Message = { id: newId(), role: "user", content: text };
    const list = [...previous, mine];
    setMessages(list);
    setInput("");
    setPending(true);

    const controller = new AbortController();
    inFlight.current = controller;
    const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: toHistory(list),
          locale,
          context: {
            safeToSpendToday: pace.safeToSpendToday,
            pctSpent: pace.pctSpent,
            dayOfCycle: pace.dayOfCycle,
            goal,
            purchase: purchase ? `${purchase.merchant}, ${formatLei(purchase.amount, locale)}` : undefined,
          },
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`chat ${res.status}`);
      const data = (await res.json()) as Partial<ChatReply>;
      if (typeof data.reply !== "string" || !data.reply.trim()) throw new Error("empty reply");
      setMessages((m) => [...m, { id: newId(), role: "assistant", content: data.reply!, source: data.source }]);
    } catch {
      if (controller.signal.aborted && inFlight.current !== controller) return; // sheet closed
      setMessages((m) => m.map((x) => (x.id === mine.id ? { ...x, failed: true } : x)));
    } finally {
      clearTimeout(timer);
      if (inFlight.current === controller) {
        inFlight.current = null;
        setPending(false);
      }
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void ask(input, messages);
  };

  const retry = (failed: Message) => void ask(failed.content, messages.filter((m) => m.id !== failed.id));

  const close = () => {
    inFlight.current?.abort();
    inFlight.current = null;
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end bg-atlas-ink/40" onClick={close}>
      <motion.section
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && close()}
        initial={reduce ? { opacity: 0 } : { y: "100%" }}
        animate={reduce ? { opacity: 1 } : { y: 0 }}
        transition={{ duration: reduce ? 0.1 : 0.3, ease: "easeOut" }}
        className="flex h-[88%] flex-col rounded-t-[28px] bg-white"
      >
        <div aria-hidden className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-atlas-line" />
        <header className="flex items-center justify-between gap-3 border-b border-atlas-line px-6 pt-2 pb-2">
          <h2 id={titleId} ref={heading} tabIndex={-1} className="font-display text-xl font-semibold outline-none">
            {t("bank.askRitm.title")}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label={t("bank.askRitm.close")}
            className="-mr-2 flex size-11 items-center justify-center rounded-full text-atlas-muted hover:bg-atlas-sea/60 focus-visible:outline-2 focus-visible:outline-ritm"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-y-contain px-6 py-4 [scrollbar-width:none]">
          <p className="max-w-[85%] rounded-2xl rounded-tl-md bg-ritm-tint px-4 py-3 leading-snug">{t("bank.askRitm.intro")}</p>

          <div role="log" aria-live="polite" aria-label={t("bank.askRitm.title")} className="mt-3 flex flex-col gap-3">
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex flex-col items-end gap-1">
                  <p className="max-w-[85%] rounded-2xl rounded-tr-md bg-ritm px-4 py-3 leading-snug break-words whitespace-pre-wrap text-white">
                    <span className="sr-only">{t("bank.askRitm.you")}: </span>
                    {m.content}
                  </p>
                  {m.failed && (
                    <div className="flex max-w-[85%] flex-col items-end gap-1 text-right text-sm text-ritm-spike">
                      <p>{t("bank.askRitm.error")}</p>
                      <button
                        type="button"
                        onClick={() => retry(m)}
                        disabled={pending}
                        className="min-h-11 rounded-full px-3 font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ritm disabled:opacity-50"
                      >
                        {t("bank.askRitm.retry")}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div key={m.id} className="flex flex-col items-start gap-1">
                  <p className="max-w-[85%] rounded-2xl rounded-tl-md bg-ritm-tint px-4 py-3 leading-snug break-words whitespace-pre-wrap">
                    <span className="sr-only">{t("bank.askRitm.ritm")}: </span>
                    {m.content}
                  </p>
                  {m.source === "fallback" && <p className="px-1 text-xs text-atlas-muted">{t("bank.askRitm.fallback")}</p>}
                </div>
              ),
            )}

            {pending && (
              <div className="flex items-center gap-1.5 self-start rounded-2xl rounded-tl-md bg-ritm-tint px-4 py-3.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    className="size-2 rounded-full bg-ritm/60 motion-safe:animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
                <span className="sr-only">{t("bank.askRitm.typing")}</span>
              </div>
            )}
          </div>
          <div ref={end} />
        </div>

        <div className="border-t border-atlas-line px-6 pt-3 pb-5">
          {messages.length === 0 && (
            <div className="-mx-1 mb-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => void ask(t(`bank.askRitm.suggestions.${key}`), messages)}
                  disabled={pending}
                  className="min-h-11 rounded-full px-4 text-sm font-medium text-ritm ring-1 ring-ritm/30 hover:bg-ritm-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm disabled:opacity-50"
                >
                  {t(`bank.askRitm.suggestions.${key}`)}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={submit} className="flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor={inputId} className="sr-only">
                {t("bank.askRitm.inputLabel")}
              </label>
              <input
                id={inputId}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                maxLength={MAX_CHARS}
                placeholder={t("bank.askRitm.placeholder")}
                enterKeyHint="send"
                autoComplete="off"
                className="min-h-12 w-full rounded-full border border-atlas-line bg-atlas-paper px-4 text-base outline-none placeholder:text-atlas-muted focus-visible:border-ritm focus-visible:ring-2 focus-visible:ring-ritm/30"
              />
            </div>
            <button
              type="submit"
              disabled={pending || !input.trim()}
              aria-label={t("bank.askRitm.send")}
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ritm text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm disabled:bg-ritm/40"
            >
              <ArrowUp className="size-5" aria-hidden="true" />
            </button>
          </form>

          <div className="mt-2 flex items-baseline justify-between gap-3 px-1 text-xs text-atlas-muted">
            <p>{t("bank.askRitm.disclaimer")}</p>
            <p className={cn("shrink-0 tabular-nums", input.length >= MAX_CHARS && "text-ritm-spike")} aria-hidden="true">
              {t("bank.askRitm.counter", { count: input.length, max: MAX_CHARS })}
            </p>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
