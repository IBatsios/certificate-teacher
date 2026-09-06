import Link from "next/link";
import {
  listArchivedSessions,
  startOrResume,
  type SessionSummary,
} from "@/lib/learning-session";
import { loadLesson, type Lesson } from "@/lib/lesson";
import { lessonProgress, type LessonProgress } from "@/lib/lesson-progress";
import { requireRole } from "@/lib/session";
import { Markdown } from "../markdown";
import { StepCard, type StepState } from "../step-card";
import { markDone, markNotDone, startOverAction } from "./actions";
import { LESSON_MESSAGES, isLessonMessageKey } from "./messages";

const LESSON_SLUG = "certificates";

export default async function CertificatesLessonPage({
  searchParams,
}: PageProps<"/lessons/certificates">) {
  const student = await requireRole("student");
  const params = await searchParams;
  const [lesson, session, earlier] = await Promise.all([
    loadLesson(LESSON_SLUG),
    startOrResume(student.id),
    listArchivedSessions(student.id),
  ]);
  const done = new Set(session.doneStepKeys);
  const progress = lessonProgress(lesson.steps, done);
  const message = messageFor(params.message);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-8 py-10">
      <LessonHeader lesson={lesson} progress={progress} />
      {message !== undefined && (
        <p
          role="alert"
          className="rounded border border-amber-400 bg-amber-50 p-3"
        >
          {message}
        </p>
      )}

      <ol className="flex flex-col gap-12 border-l-2 border-neutral-200 [&>li]:-ml-[2px]">
        {lesson.steps.map((step) => (
          <li key={step.key}>
            <StepCard
              step={step}
              state={stateOf(step.key, done, progress)}
              markDone={markDone}
              markNotDone={markNotDone}
            />
          </li>
        ))}
      </ol>

      {progress.isComplete && <Finished />}
      <StartOver />
      {earlier.length > 0 && (
        <EarlierSessions
          sessions={earlier}
          total={progress.total}
          lesson={lesson}
        />
      )}
    </main>
  );
}

function LessonHeader({
  lesson,
  progress,
}: {
  lesson: Lesson;
  progress: LessonProgress;
}) {
  const percent =
    progress.total === 0 ? 0 : (progress.done / progress.total) * 100;
  return (
    <header className="flex flex-col gap-4">
      <p className="text-sm font-medium tracking-wide text-neutral-600 uppercase">
        Lesson 1
      </p>
      <h1 className="text-3xl font-semibold text-balance text-neutral-900">
        {lesson.title}
      </h1>
      <div className="text-neutral-800">
        <Markdown text={lesson.intro} />
      </div>
      <div className="flex flex-col gap-2" aria-live="polite">
        <p className="text-sm text-neutral-700 tabular-nums">
          {progress.done} of {progress.total} steps done
        </p>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={progress.done}
          aria-label="Lesson progress"
          className="h-2 w-full overflow-hidden rounded-full bg-neutral-200"
        >
          <div
            className="h-full rounded-full bg-emerald-600 transition-[width] duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </header>
  );
}

function stateOf(
  stepKey: string,
  done: ReadonlySet<string>,
  progress: LessonProgress,
): StepState {
  if (done.has(stepKey)) {
    return "done";
  }
  return stepKey === progress.nextStepKey ? "next" : "later";
}

function Finished() {
  return (
    <section
      aria-labelledby="finished-title"
      className="rounded-lg border border-emerald-300 bg-emerald-50 p-5"
    >
      <h2
        id="finished-title"
        className="text-lg font-semibold text-emerald-900"
      >
        Every step is done
      </h2>
      <p className="mt-1 text-emerald-900">
        You have a root and a leaf on your computer, and you have seen the chain
        between them. The deploy lesson, which puts them to work, arrives next.
        Until then you can{" "}
        <Link href="/test" className="underline underline-offset-2">
          take the test
        </Link>
        .
      </p>
    </section>
  );
}

function StartOver() {
  return (
    <section
      aria-labelledby="start-over-title"
      className="flex flex-col gap-3 border-t border-neutral-200 pt-8"
    >
      <h2 id="start-over-title" className="text-lg font-semibold">
        Start over
      </h2>
      <p className="text-neutral-700">
        Begins a fresh run with nothing ticked. The run you are on now is kept
        and listed below, so nothing is lost.
      </p>
      <form action={startOverAction}>
        <button
          type="submit"
          className="min-h-11 rounded border border-neutral-400 bg-white px-4 font-medium transition-[background-color,transform] duration-150 ease-out hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black active:scale-[0.97]"
        >
          Start over
        </button>
      </form>
    </section>
  );
}

function EarlierSessions({
  sessions,
  total,
  lesson,
}: {
  sessions: ReadonlyArray<SessionSummary>;
  total: number;
  lesson: Lesson;
}) {
  const stepKeys = new Set(lesson.steps.map((step) => step.key));
  return (
    <section
      aria-labelledby="earlier-title"
      className="flex flex-col gap-3 border-t border-neutral-200 pt-8"
    >
      <h2 id="earlier-title" className="text-lg font-semibold">
        Earlier sessions
      </h2>
      <ul className="flex flex-col gap-2 text-sm text-neutral-700">
        {sessions.map((session) => (
          <li key={session.id} className="tabular-nums">
            Started {formatDate(session.startedAt)}:{" "}
            {session.doneStepKeys.filter((key) => stepKeys.has(key)).length} of{" "}
            {total} steps done
            {session.archivedAt !== null &&
              `, set aside ${formatDate(session.archivedAt)}`}
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function messageFor(value: string | string[] | undefined): string | undefined {
  const key = Array.isArray(value) ? value[0] : value;
  return key !== undefined && isLessonMessageKey(key)
    ? LESSON_MESSAGES[key]
    : undefined;
}
