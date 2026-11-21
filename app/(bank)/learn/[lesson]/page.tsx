import { Suspense } from "react";
import { LESSONS } from "@/components/bank/learn/content";
import { LessonPlayer } from "@/components/bank/learn/LessonPlayer";

export function generateStaticParams() {
  return LESSONS.map((l) => ({ lesson: l.id }));
}

/** Not async: the lesson id is awaited inside Suspense, so navigation stays instant (Cache Components). */
export default function LessonPage(props: PageProps<"/learn/[lesson]">) {
  return (
    <Suspense fallback={null}>
      <Lesson params={props.params} />
    </Suspense>
  );
}

async function Lesson({ params }: { params: PageProps<"/learn/[lesson]">["params"] }) {
  const { lesson } = await params;
  return <LessonPlayer id={lesson} />;
}
