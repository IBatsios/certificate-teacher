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

export type CourseProgress = Readonly<{
  done: number;
  total: number;
  isComplete: boolean;
}>;

/**
 * How far a set of done step keys gets through every lesson together. This is
 * what "the student finished" means: the certificates lesson and the deploy
 * lesson, not either one alone. Keys that no lesson uses any more are ignored,
 * so retiring a step from the content cannot leave a session over-counted.
 * Pure.
 */
export function courseProgress(
  lessons: ReadonlyArray<
    Readonly<{ steps: ReadonlyArray<Readonly<{ key: string }>> }>
  >,
  doneKeys: ReadonlySet<string>,
): CourseProgress {
  const steps = lessons.flatMap((lesson) => lesson.steps);
  const done = steps.filter((step) => doneKeys.has(step.key)).length;
  return {
    done,
    total: steps.length,
    isComplete: steps.length > 0 && done === steps.length,
  };
}
