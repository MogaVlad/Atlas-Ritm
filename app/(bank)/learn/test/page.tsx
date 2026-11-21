"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { Choices } from "@/components/bank/learn/Choices";
import { lessonsOf, type Question } from "@/components/bank/learn/content";
import { formatAltitude } from "@/components/bank/learn/format";
import { Mountain } from "@/components/bank/learn/Mountain";
import { levelForNext, pickQuestion, PLACEMENT, placementLevel, type Answer } from "@/components/bank/learn/placement";
import { useLearn, useLearnReady } from "@/components/bank/learn/progress";
import { useLocale, useT } from "@/lib/i18n";

const PRIMARY =
  "flex min-h-12 items-center justify-center rounded-full bg-atlas-pine px-5 font-medium text-white transition-colors hover:bg-atlas-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine";

/** The placement test: 7 adaptive questions, then the camp you start at. */
export default function PlacementTest() {
  const ready = useLearnReady();
  if (!ready) return null;
  return <Test />;
}

function Test() {
  const t = useT();
  const setPlacement = useLearn((s) => s.setPlacement);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [question, setQuestion] = useState<Question | null>(() => pickQuestion(PLACEMENT.start, []));
  const [chosen, setChosen] = useState<number | null>(null);
  const [result, setResult] = useState<{ level: number; right: number; total: number } | null>(null);
  // Next keeps left pages alive with their state: start a fresh test each time the page shows again.
  useLayoutEffect(
    () => () => {
      setAnswers([]);
      setQuestion(pickQuestion(PLACEMENT.start, []));
      setChosen(null);
      setResult(null);
    },
    [],
  );

  if (result) return <Result {...result} />;
  if (!question) return null;

  const isLast = answers.length + 1 >= PLACEMENT.length;
  const next = () => {
    if (chosen === null) return;
    const all = [...answers, { id: question.id, level: question.level, correct: chosen === question.correct }];
    const following = isLast ? null : pickQuestion(levelForNext(all), all.map((a) => a.id));
    if (!following) {
      const level = placementLevel(all);
      const right = all.filter((a) => a.correct).length;
      setPlacement(level, right, all.length);
      setResult({ level, right, total: all.length });
      return;
    }
    setAnswers(all);
    setQuestion(following);
    setChosen(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-atlas-muted tabular-nums">
          {t("bank.learn.test.question", { i: answers.length + 1, n: PLACEMENT.length })}
        </p>
        <Link
          href="/learn"
          aria-label={t("bank.learn.test.exit")}
          className="-mr-2 flex size-11 items-center justify-center rounded-full text-atlas-muted hover:bg-atlas-sea/60 focus-visible:outline-2 focus-visible:outline-atlas-pine"
        >
          <X className="size-5" aria-hidden="true" />
        </Link>
      </div>
      {/* Progress: one segment per question. */}
      <div className="flex gap-1.5" aria-hidden="true">
        {Array.from({ length: PLACEMENT.length }, (_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= answers.length ? "bg-atlas-pine" : "bg-atlas-line"}`} />
        ))}
      </div>
      <p className="self-start rounded-full bg-atlas-paper px-3 py-1 text-xs font-medium text-atlas-muted ring-1 ring-atlas-line">
        {t("bank.learn.test.level", { level: question.level })}
      </p>

      <Choices
        base={`bank.learn.q.${question.id}`}
        options={question.options}
        correct={question.correct}
        chosen={chosen}
        onChoose={setChosen}
        headingId="placement-q"
      />

      {chosen !== null && (
        <button type="button" onClick={next} className={PRIMARY}>
          {t(isLast ? "bank.learn.test.seeResult" : "bank.learn.test.next")}
        </button>
      )}
    </div>
  );
}

function Result({ level, right, total }: { level: number; right: number; total: number }) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const first = lessonsOf(level)[0];
  return (
    <section aria-labelledby="placement-result" className="flex flex-col gap-5">
      <div className="overflow-hidden rounded-[28px] bg-white ring-1 ring-atlas-line">
        <Mountain level={level} className="block w-full bg-atlas-paper" />
        <div className="p-5">
          <h1 id="placement-result" className="font-display text-[1.6rem] leading-tight font-semibold">
            {t("bank.learn.test.resultTitle", { alt: formatAltitude(level, locale) })}
          </h1>
          <p className="mt-1 font-medium">{t(`bank.learn.levels.${level}.name`)}</p>
          <p className="mt-1 text-sm leading-relaxed text-atlas-muted">{t(`bank.learn.levels.${level}.about`)}</p>
          <p className="mt-3 text-sm text-atlas-muted">{t("bank.learn.test.resultScore", { right, total })}</p>
        </div>
      </div>
      {first && (
        <Link href={`/learn/${first.id}`} className={PRIMARY}>
          {t("bank.learn.test.firstLesson")}
        </Link>
      )}
      <Link
        href="/learn"
        className="flex min-h-12 items-center justify-center rounded-full px-5 font-medium text-atlas-pine hover:bg-atlas-sea/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-pine"
      >
        {t("bank.learn.test.seePath")}
      </Link>
    </section>
  );
}
