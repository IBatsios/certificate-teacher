export type LessonProgress = Readonly<{
  done: number;
  total: number;
  /** The first step not yet done, in lesson order; null when all are done. */
  nextStepKey: string | null;
  isComplete: boolean;
}>;

/** How far through a lesson a set of done step keys gets. Pure. */
export function lessonProgress(
  steps: ReadonlyArray<Readonly<{ key: string }>>,
  doneKeys: ReadonlySet<string>,
): LessonProgress {
  const done = steps.filter((step) => doneKeys.has(step.key)).length;
  const next = steps.find((step) => !doneKeys.has(step.key));
  return {
    done,
    total: steps.length,
    nextStepKey: next === undefined ? null : next.key,
    isComplete: steps.length > 0 && done === steps.length,
  };
}
