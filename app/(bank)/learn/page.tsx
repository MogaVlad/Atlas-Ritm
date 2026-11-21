"use client";

import { Check, ChevronRight, Lock } from "lucide-react";
import Link from "next/link";
import { LEVELS, lessonsOf, type Lesson } from "@/components/bank/learn/content";
import { formatAltitude } from "@/components/bank/learn/format";
import { Mountain } from "@/components/bank/learn/Mountain";
import { currentLevel, reachedSummit } from "@/components/bank/learn/placement";
import { useLearn, useLearnReady } from "@/components/bank/learn/progress";
import { useLocale, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const H1 = "font-display text-[1.7rem] leading-tight font-semibold tracking-[-0.02em]";

/** Learn tab: before the placement test, the invitation; after it, where you are on the mountain. */
export default function LearnPage() {
  const ready = useLearnReady();
  const placedAt = useLearn((s) => s.placedAt);
  if (!ready) return null;
  return placedAt === null ? <Intro /> : <Trail />;
}

function Header() {
  const t = useT();
  return (
    <header>
      <h1 className={H1}>{t("bank.learn.title")}</h1>
      <p className="mt-1 leading-relaxed text-atlas-muted">{t("bank.learn.lead")}</p>
    </header>
  );
}

function Intro() {
  const t = useT();
  const setPlacement = useLearn((s) => s.setPlacement);
  return (
    <div className="flex flex-col gap-5">
      <Header />
      <section aria-labelledby="learn-intro" className="overflow-hidden rounded-[28px] bg-white ring-1 ring-atlas-line">
        <Mountain level={null} className="block w-full bg-atlas-paper" />
        <div className="p-5">
          <h2 id="learn-intro" className="font-display text-xl font-semibold">
            {t("bank.learn.introTitle")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-atlas-ink/80">{t("bank.learn.introBody")}</p>
          <Link
            href="/learn/test"
            className="mt-5 flex min-h-12 items-center justify-center rounded-full bg-atlas-pine px-5 font-medium text-white transition-colors hover:bg-atlas-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine"
          >
            {t("bank.learn.startTest")}
          </Link>
          <button
            type="button"
            onClick={() => setPlacement(1, 0, 0)}
            className="mt-2 min-h-12 w-full rounded-full px-5 font-medium text-atlas-pine transition-colors hover:bg-atlas-sea/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine"
          >
            {t("bank.learn.skipTest")}
          </button>
        </div>
      </section>
    </div>
  );
}

function Trail() {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const placedAt = useLearn((s) => s.placedAt);
  const completed = useLearn((s) => s.completed);
  const level = currentLevel(placedAt, completed);
  const summit = reachedSummit(completed);
  const name = (l: number) => t(`bank.learn.levels.${l}.name`);
  const nextId = lessonsOf(level).find((l) => !completed.includes(l.id))?.id;

  return (
    <div className="flex flex-col gap-6">
      <Header />

      <section aria-labelledby="learn-here" className="overflow-hidden rounded-[28px] bg-white ring-1 ring-atlas-line">
        <Mountain level={level} summit={summit} className="block w-full bg-atlas-paper" />
        <div className="p-5">
          <h2 id="learn-here" className="font-display text-xl font-semibold">
            {summit ? t("bank.learn.lesson.summit") : t("bank.learn.here", { alt: formatAltitude(level, locale), name: name(level) })}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-atlas-muted">
            {summit ? t("bank.learn.summit") : t(`bank.learn.levels.${level}.about`)}
          </p>
        </div>
      </section>

      {!summit && (
        <section aria-labelledby="learn-now">
          <h2 id="learn-now" className="font-display text-lg font-semibold">
            {t("bank.learn.nowTitle")}
          </h2>
          <ol className="mt-2 flex flex-col gap-2">
            {lessonsOf(level).map((l, i) => (
              <LessonLink key={l.id} lesson={l} index={i + 1} done={completed.includes(l.id)} next={l.id === nextId} />
            ))}
          </ol>
        </section>
      )}

      <section aria-labelledby="learn-path">
        <h2 id="learn-path" className="font-display text-lg font-semibold">
          {t("bank.learn.pathTitle")}
        </h2>
        <ol className="mt-2 divide-y divide-atlas-line rounded-3xl bg-white px-5 ring-1 ring-atlas-line">
          {LEVELS.map(({ level: l }) => {
            const lessons = lessonsOf(l);
            const allDone = lessons.every((x) => completed.includes(x.id));
            const status =
              l > level ? "locked" : allDone ? "done" : placedAt !== null && l < placedAt ? "known" : l === level ? "now" : "done";
            return (
              <li key={l} className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-atlas-muted tabular-nums">{formatAltitude(l, locale)}</p>
                    <p className={cn("font-medium", status === "locked" && "text-atlas-muted")}>{name(l)}</p>
                  </div>
                  {status !== "locked" && (
                    <span
                      className={cn(
                        "mt-0.5 flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                        status === "now" ? "bg-atlas-brass-light/30 text-atlas-ink" : "bg-atlas-paper text-atlas-muted",
                      )}
                    >
                      {status === "done" && <Check className="size-3" aria-hidden="true" />}
                      {t(`bank.learn.${status}`)}
                    </span>
                  )}
                </div>
                {status === "locked" && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-atlas-muted">
                    <Lock className="size-3.5 shrink-0" aria-hidden="true" />
                    {t("bank.learn.lockedAfter", { name: name(l - 1) })}
                  </p>
                )}
                {status !== "locked" && l !== level && (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {lessons.map((x) => (
                      <li key={x.id}>
                        <Link
                          href={`/learn/${x.id}`}
                          className="flex min-h-11 items-center rounded-full border border-atlas-line px-3.5 text-sm text-atlas-pine hover:border-atlas-pine/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine"
                        >
                          {t(`bank.learn.lessons.${x.id}.title`)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* Retaking only moves the starting camp; finished lessons stay finished. */}
      <Link
        href="/learn/test"
        className="flex min-h-11 items-center self-center rounded-full px-4 text-sm font-medium text-atlas-pine underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-atlas-pine"
      >
        {t("bank.learn.retake")}
      </Link>
    </div>
  );
}

function LessonLink({ lesson, index, done, next }: { lesson: Lesson; index: number; done: boolean; next: boolean }) {
  const t = useT();
  return (
    <li>
      <Link
        href={`/learn/${lesson.id}`}
        className={cn(
          "flex min-h-16 items-center gap-4 rounded-3xl px-4 py-3 ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine",
          next ? "bg-atlas-ink text-white ring-atlas-ink hover:bg-atlas-pine" : "bg-white ring-atlas-line hover:ring-atlas-pine/40",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full font-display font-semibold",
            done ? "bg-atlas-sea text-atlas-pine" : next ? "bg-atlas-brass-light text-atlas-ink" : "bg-atlas-paper text-atlas-muted",
          )}
        >
          {done ? <Check className="size-5" /> : index}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{t(`bank.learn.lessons.${lesson.id}.title`)}</span>
          <span className={cn("block text-sm", next ? "text-white/70" : "text-atlas-muted")}>
            {t(done ? "bank.learn.lessonDone" : next ? "bank.learn.lessonNext" : "bank.learn.lessonOpen")}
          </span>
        </span>
        <ChevronRight className={cn("size-5 shrink-0", next ? "text-white/70" : "text-atlas-muted")} aria-hidden="true" />
      </Link>
    </li>
  );
}
