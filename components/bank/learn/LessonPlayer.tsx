"use client";

import { ArrowUpRight, Check, Lock, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocale, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Choices } from "./Choices";
import { findLesson, lessonsOf, LESSONS, type Lesson } from "./content";
import { formatAltitude } from "./format";
import { MoneyCard } from "./MoneyCard";
import { currentLevel, reachedSummit } from "./placement";
import { useLearn, useLearnReady } from "./progress";

const PRIMARY =
  "flex min-h-12 items-center justify-center rounded-full bg-atlas-pine px-5 font-medium text-white transition-colors hover:bg-atlas-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine";
const SECONDARY =
  "flex min-h-12 items-center justify-center rounded-full px-5 font-medium text-atlas-pine hover:bg-atlas-sea/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine";

type Step = "card0" | "card1" | "money" | "check";

/** One lesson: two short cards, the idea on your own money, a check question, then done. */
export function LessonPlayer({ id }: { id: string }) {
  const t = useT();
  const ready = useLearnReady();
  const placedAt = useLearn((s) => s.placedAt);
  const completed = useLearn((s) => s.completed);
  const lesson = findLesson(id);
  if (!ready) return null;

  if (!lesson) return <Message text={t("bank.learn.lesson.notFound")} />;
  const level = currentLevel(placedAt, completed);
  if (lesson.level > level) {
    return <Message icon text={t("bank.learn.lesson.locked", { name: t(`bank.learn.levels.${lesson.level - 1}.name`) })} />;
  }
  return <Player key={lesson.id} lesson={lesson} />;
}

function Message({ text, icon = false }: { text: string; icon?: boolean }) {
  const t = useT();
  return (
    <div className="flex flex-col items-center gap-4 pt-10 text-center">
      {icon && <Lock className="size-8 text-atlas-muted" aria-hidden="true" />}
      <p className="max-w-72 text-atlas-muted">{text}</p>
      <Link href="/learn" className={SECONDARY}>
        {t("bank.learn.lesson.backToPath")}
      </Link>
    </div>
  );
}

function Player({ lesson }: { lesson: Lesson }) {
  const t = useT();
  const placedAt = useLearn((s) => s.placedAt);
  const completed = useLearn((s) => s.completed);
  const completeLesson = useLearn((s) => s.completeLesson);
  const steps: Step[] = ["card0", "card1", ...(lesson.money ? (["money"] as const) : []), "check"];
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  // Level before finishing, to tell "you climbed" afterwards.
  const [levelBefore, setLevelBefore] = useState<number | null>(null);
  const top = useRef<HTMLDivElement>(null);

  // Next keeps left pages alive: open the lesson from its first card every time.
  useLayoutEffect(
    () => () => {
      setIndex(0);
      setChosen(null);
      setLevelBefore(null);
    },
    [],
  );
  // Block body on purpose: scrollIntoView returns a Promise in new Chrome, and an effect must not return one.
  useEffect(() => {
    top.current?.scrollIntoView({ block: "start" });
  }, [index]);

  const step = steps[index];
  const base = `bank.learn.lessons.${lesson.id}`;
  const finished = levelBefore !== null;

  const finish = () => {
    setLevelBefore(currentLevel(placedAt, completed));
    completeLesson(lesson.id);
  };

  if (finished) return <Done lesson={lesson} levelBefore={levelBefore} />;

  return (
    <div ref={top} className="flex scroll-mt-20 flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-atlas-muted tabular-nums">{t("bank.learn.lesson.step", { i: index + 1, n: steps.length })}</p>
          <p className="truncate font-display text-lg font-semibold">{t(`${base}.title`)}</p>
        </div>
        <Link
          href="/learn"
          aria-label={t("bank.learn.lesson.close")}
          className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-atlas-muted hover:bg-atlas-sea/60 focus-visible:outline-2 focus-visible:outline-atlas-pine"
        >
          <X className="size-5" aria-hidden="true" />
        </Link>
      </div>
      <div className="flex gap-1.5" aria-hidden="true">
        {steps.map((s, i) => (
          <span key={s} className={cn("h-1.5 flex-1 rounded-full", i <= index ? "bg-atlas-pine" : "bg-atlas-line")} />
        ))}
      </div>

      {(step === "card0" || step === "card1") && (
        <article className="rounded-3xl bg-white p-6 ring-1 ring-atlas-line">
          <h2 className="font-display text-xl font-semibold text-balance">{t(`${base}.cards.${step === "card0" ? 0 : 1}.title`)}</h2>
          <p className="mt-3 text-lg leading-relaxed text-pretty text-atlas-ink/85">{t(`${base}.cards.${step === "card0" ? 0 : 1}.body`)}</p>
        </article>
      )}
      {step === "money" && lesson.money && <MoneyCard lessonId={lesson.id} kind={lesson.money} />}
      {step === "check" && (
        <>
          <p className="text-sm font-medium text-atlas-muted">{t("bank.learn.lesson.check")}</p>
          <Choices
            base={`${base}.check`}
            options={lesson.check.options}
            correct={lesson.check.correct}
            chosen={chosen}
            onChoose={setChosen}
            headingId={`check-${lesson.id}`}
          />
        </>
      )}

      {step !== "check" && (
        <button type="button" onClick={() => setIndex((i) => i + 1)} className={PRIMARY}>
          {t("bank.learn.lesson.next")}
        </button>
      )}
      {step === "check" && chosen !== null && chosen === lesson.check.correct && (
        <button type="button" onClick={finish} className={PRIMARY}>
          {t("bank.learn.lesson.finish")}
        </button>
      )}
      {/* A wrong answer explains why and lets you try again: no lives to lose. */}
      {step === "check" && chosen !== null && chosen !== lesson.check.correct && (
        <button type="button" onClick={() => setChosen(null)} className={PRIMARY}>
          {t("bank.learn.lesson.tryAgain")}
        </button>
      )}
    </div>
  );
}

function Done({ lesson, levelBefore }: { lesson: Lesson; levelBefore: number }) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const placedAt = useLearn((s) => s.placedAt);
  const completed = useLearn((s) => s.completed);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);

  const level = currentLevel(placedAt, completed);
  const summit = reachedSummit(completed) && lesson.level === 5;
  const climbed = level > levelBefore;
  const next = lessonsOf(level).find((l) => !completed.includes(l.id)) ?? LESSONS.find((l) => l.level > lesson.level && !completed.includes(l.id));

  return (
    <section aria-labelledby="lesson-done" className="flex flex-col items-center gap-4 pt-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-atlas-sea text-atlas-pine" aria-hidden="true">
        <Check className="size-8" strokeWidth={2.25} />
      </span>
      <h1 id="lesson-done" ref={heading} tabIndex={-1} className="font-display text-2xl font-semibold outline-none">
        {t("bank.learn.lesson.doneTitle")}
      </h1>
      <p className="text-atlas-muted">{t(`bank.learn.lessons.${lesson.id}.title`)}</p>
      {(climbed || summit) && (
        <p role="status" className="rounded-2xl bg-atlas-ink px-4 py-3 font-medium text-white">
          {summit ? t("bank.learn.lesson.summit") : t("bank.learn.lesson.levelUp", { alt: formatAltitude(level, locale), name: t(`bank.learn.levels.${level}.name`) })}
        </p>
      )}
      {lesson.apply && (
        <Link
          href={lesson.apply.href}
          className="flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-atlas-pine underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-atlas-pine"
        >
          {t("bank.learn.lesson.apply")}: {t(`bank.learn.lessons.${lesson.id}.apply`)}
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      )}
      <div className="mt-2 flex w-full flex-col gap-2">
        {next && !summit && (
          <Link href={`/learn/${next.id}`} className={PRIMARY}>
            {t("bank.learn.lesson.nextLesson")}
          </Link>
        )}
        <Link href="/learn" className={SECONDARY}>
          {t("bank.learn.lesson.backToPath")}
        </Link>
      </div>
    </section>
  );
}
