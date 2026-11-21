"use client";

import { ChevronRight, Mountain } from "lucide-react";
import Link from "next/link";
import { useLocale, useT } from "@/lib/i18n";
import { lessonsOf } from "./content";
import { formatAltitude } from "./format";
import { currentLevel, reachedSummit } from "./placement";
import { useLearn, useLearnReady } from "./progress";

/**
 * Home entry to Learn: before the placement test, the invitation to take it;
 * afterwards, where you are and the next lesson, one tap away.
 */
export function LearnCard() {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const ready = useLearnReady();
  const placedAt = useLearn((s) => s.placedAt);
  const completed = useLearn((s) => s.completed);
  if (!ready) return null;

  let href = "/learn";
  let title = t("bank.learn.home.invite");
  let body = t("bank.learn.home.inviteBody");
  if (placedAt !== null) {
    const level = currentLevel(placedAt, completed);
    const next = lessonsOf(level).find((l) => !completed.includes(l.id));
    title = t("bank.learn.here", { alt: formatAltitude(level, locale), name: t(`bank.learn.levels.${level}.name`) });
    if (reachedSummit(completed) || !next) {
      body = t("bank.learn.home.summit");
    } else {
      href = `/learn/${next.id}`;
      body = t("bank.learn.home.next", { title: t(`bank.learn.lessons.${next.id}.title`) });
    }
  }

  return (
    <section aria-label={t("bank.learn.title")}>
      <Link
        href={href}
        className="flex min-h-16 items-center gap-4 rounded-3xl bg-white px-4 py-3.5 ring-1 ring-atlas-line transition-colors hover:ring-atlas-pine/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-atlas-ink text-atlas-brass-light" aria-hidden="true">
          <Mountain className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium leading-snug">{title}</span>
          <span className="mt-0.5 block text-sm leading-snug text-atlas-muted">{body}</span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-atlas-muted" aria-hidden="true" />
      </Link>
    </section>
  );
}
