"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { fromDraft, GoalsEditor, toDraft, type GoalDraft } from "@/components/ritm/GoalsEditor";
import { leaveRitm, RitmBack } from "@/components/ritm/RitmBack";
import { useHydrated } from "@/components/ritm/useHydrated";
import { NET_SALARY } from "@/lib/data/persona";
import { useHtmlLang, useT } from "@/lib/i18n";
import { useBank } from "@/lib/store/useBank";

/** Edit the savings goals after onboarding: add, remove, change the amount or the time. */
export default function GoalsScreen() {
  useHtmlLang();
  const t = useT();
  const router = useRouter();
  const hydrated = useHydrated();
  const saved = useBank((s) => s.ritm.goals);
  const setGoals = useBank((s) => s.setGoals);
  const monthlyLock = useBank((s) => (s.ritm.lock.amount > 0 ? s.ritm.lock.amount : 0));
  // null = not edited yet: show the saved goals.
  const [drafts, setDrafts] = useState<GoalDraft[] | null>(null);
  const [invalid, setInvalid] = useState(false);

  // Next keeps this page alive after we leave: the next visit starts from the saved goals.
  useLayoutEffect(
    () => () => {
      setDrafts(null);
      setInvalid(false);
    },
    [],
  );

  if (!hydrated) return null;

  const goals = drafts ?? saved.map(toDraft);
  const save = () => {
    if (!setGoals(goals.map(fromDraft))) return setInvalid(true);
    leaveRitm(router);
  };

  return (
    <>
      <header className="flex items-center justify-between gap-4 px-5 pt-3">
        <RitmBack />
      </header>
      <main className="flex flex-1 flex-col gap-6 px-5 pt-4 pb-6">
        <h1 className="font-display text-[1.7rem] leading-tight font-semibold tracking-[-0.02em]">{t("ritm.goals.editTitle")}</h1>
        <GoalsEditor
          goals={goals}
          onChange={(next) => {
            setDrafts(next);
            setInvalid(false);
          }}
          netSalary={NET_SALARY}
          invalid={invalid}
          monthlyLock={monthlyLock}
        />
      </main>
      <footer className="sticky bottom-0 border-t border-atlas-line bg-atlas-paper/95 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        <button
          type="button"
          onClick={save}
          className="min-h-12 w-full rounded-full bg-ritm px-5 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm"
        >
          {t("ritm.goals.save")}
        </button>
      </footer>
    </>
  );
}
