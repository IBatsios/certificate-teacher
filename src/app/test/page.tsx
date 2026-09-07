import Link from "next/link";
import { COURSE_SLUGS, lessonPath } from "@/lib/lesson-routes";
import { courseProgress } from "@/lib/lesson-progress";
import { loadLesson } from "@/lib/lesson";
import { startOrResume } from "@/lib/learning-session";
import {
  loadQuestionBank,
  type Question,
  type QuestionBank,
  type Topic,
} from "@/lib/questions";
import { passMarkFor } from "@/lib/score";
import { requireRole } from "@/lib/session";
import { findAttempt, type AttemptSummary } from "@/lib/test-attempt";
import { submitTestAttempt } from "./actions";
import { TEST_MESSAGES, isTestMessageKey } from "./messages";

export default async function TestPage({ searchParams }: PageProps<"/test">) {
  const student = await requireRole("student");
  const params = await searchParams;
  const bank = await loadQuestionBank();

  const attemptId = firstValue(params.attempt);
  if (attemptId !== undefined) {
    const attempt = await findAttempt(student.id, attemptId);
    return attempt === null ? (
      <QuestionForm bank={bank} message={TEST_MESSAGES["not-found"]} />
    ) : (
      <Result attempt={attempt} bank={bank} />
    );
  }

  const errorKey = firstValue(params.error);
  const message =
    errorKey !== undefined && isTestMessageKey(errorKey)
      ? TEST_MESSAGES[errorKey]
      : undefined;

  return (
    <QuestionForm
      bank={bank}
      message={message}
      unfinished={await unfinishedLessons(student.id)}
    />
  );
}

/**
 * The lessons this student has not finished. The test is never locked (D59):
 * knowing what you do not know is part of the point, and a student who takes
 * it early gets focus areas telling them exactly where to go.
 */
async function unfinishedLessons(
  userId: string,
): Promise<ReadonlyArray<string>> {
  const [session, lessons] = await Promise.all([
    startOrResume(userId),
    Promise.all(COURSE_SLUGS.map((slug) => loadLesson(slug))),
  ]);
  const done = new Set(session.doneStepKeys);
  return lessons
    .filter((lesson) => !courseProgress([lesson], done).isComplete)
    .map((lesson) => lesson.slug);
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function QuestionForm({
  bank,
  message,
  unfinished = [],
}: {
  bank: QuestionBank;
  message?: string;
  unfinished?: ReadonlyArray<string>;
}) {
  const perTopic = bank.questions.length / bank.topics.length;
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-8 py-10">
      <header className="flex flex-col gap-4">
        <p className="text-sm font-medium tracking-wide text-neutral-600 uppercase">
          The test
        </p>
        <h1 className="text-3xl font-semibold text-balance text-neutral-900">
          Show what you have learned
        </h1>
        <p className="text-neutral-800">
          {bank.questions.length} questions, grouped by the four parts of the
          course. To pass you need {passMarkFor(perTopic)} of {perTopic} right
          in <em>every</em> group: knowing three parts well and one not at all
          is exactly what this is meant to catch. If you do not pass, the parts
          to go back to are named for you.
        </p>
        <p className="text-neutral-800">
          There is no limit on attempts and nothing is lost by trying.
        </p>
      </header>

      {unfinished.length > 0 && (
        <p className="rounded border border-neutral-300 bg-neutral-50 p-3 text-neutral-800">
          You have not finished{" "}
          {unfinished.map((slug, index) => (
            <span key={slug}>
              {index > 0 && " and "}
              <Link
                href={lessonPath(slug)}
                className="underline underline-offset-2"
              >
                the {slug} lesson
              </Link>
            </span>
          ))}
          . You are welcome to take the test anyway; it will tell you what to go
          back to.
        </p>
      )}

      {message !== undefined && (
        <p
          role="alert"
          className="rounded border border-amber-400 bg-amber-50 p-3"
        >
          {message}
        </p>
      )}

      <form action={submitTestAttempt} className="flex flex-col gap-10">
        {bank.topics.map((topic) => (
          <TopicSection
            key={topic.id}
            topic={topic}
            questions={bank.questions.filter(
              (question) => question.topic === topic.id,
            )}
          />
        ))}
        <button
          type="submit"
          className="min-h-11 self-start rounded bg-black px-5 font-medium text-white transition-[background-color,transform] duration-150 ease-out hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black active:scale-[0.97]"
        >
          Check my answers
        </button>
      </form>
    </main>
  );
}

function TopicSection({
  topic,
  questions,
}: {
  topic: Topic;
  questions: ReadonlyArray<Question>;
}) {
  return (
    <section
      aria-labelledby={`topic-${topic.id}`}
      className="flex flex-col gap-6"
    >
      <h2
        id={`topic-${topic.id}`}
        className="border-b border-neutral-200 pb-2 text-xl font-semibold"
      >
        {topic.title}
      </h2>
      {questions.map((question) => (
        <QuestionFields key={question.id} question={question} />
      ))}
    </section>
  );
}

function QuestionFields({ question }: { question: Question }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 font-medium text-balance">
        {question.prompt}
      </legend>
      {question.choices.map((choice) => (
        <label
          key={choice.id}
          className="flex items-start gap-3 rounded p-1 has-checked:bg-neutral-100"
        >
          <input
            type="radio"
            name={question.id}
            value={choice.id}
            required
            className="mt-1.5"
          />
          <span>{choice.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

function Result({
  attempt,
  bank,
}: {
  attempt: AttemptSummary;
  bank: QuestionBank;
}) {
  const titleOf = (topicId: string) =>
    bank.topics.find((topic) => topic.id === topicId)?.title ?? topicId;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-8 py-10">
      <section
        aria-labelledby="result-title"
        className={`rounded-lg border p-5 ${
          attempt.passed
            ? "border-emerald-300 bg-emerald-50"
            : "border-amber-400 bg-amber-50"
        }`}
      >
        <h1
          id="result-title"
          className={`text-2xl font-semibold ${
            attempt.passed ? "text-emerald-900" : "text-amber-900"
          }`}
        >
          {attempt.passed ? "You passed" : "Not yet"}
        </h1>
        <p className="mt-2 text-neutral-900 tabular-nums">
          {attempt.correct} of {attempt.total} correct.
        </p>
        {attempt.passed ? (
          <p className="mt-2 text-emerald-900">
            You made a certificate, served it, trusted it, put a reverse proxy
            in front of it, and taught Java to accept it — and you can say why
            each of those worked. That is the whole course.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-2 text-amber-900">
            <p>Go back to these parts, then take it again:</p>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              {attempt.focusAreas.map((topicId) => (
                <li key={topicId} className="font-medium">
                  {titleOf(topicId)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <p className="text-sm text-neutral-600 tabular-nums">
        Recorded {attempt.createdAt.toISOString()}
      </p>

      <div className="flex flex-wrap gap-4">
        <Link href="/test" className="underline underline-offset-2">
          {attempt.passed ? "Take it again" : "Try again"}
        </Link>
        <Link
          href={lessonPath("certificates")}
          className="underline underline-offset-2"
        >
          Back to the lessons
        </Link>
      </div>
    </main>
  );
}
