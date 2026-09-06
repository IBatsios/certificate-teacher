import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { QUESTIONS, type Question } from "@/lib/questions";
import { submitTestAttempt } from "./actions";
import { TEST_MESSAGES, isTestMessageKey } from "./messages";

export default async function TestPage({ searchParams }: PageProps<"/test">) {
  const student = await requireRole("student");
  const params = await searchParams;
  const attemptId = firstValue(params.attempt);

  if (attemptId !== undefined) {
    const attempt = await prisma.testAttempt.findFirst({
      where: { id: attemptId, userId: student.id },
    });
    if (attempt !== null) {
      return <ResultView passed={attempt.passed} takenAt={attempt.createdAt} />;
    }
    return <QuestionForm message={TEST_MESSAGES["not-found"]} />;
  }

  const errorKey = firstValue(params.error);
  const message =
    errorKey !== undefined && isTestMessageKey(errorKey)
      ? TEST_MESSAGES[errorKey]
      : undefined;

  return <QuestionForm message={message} />;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function QuestionForm({ message }: { message?: string }) {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <h1 className="text-2xl font-semibold">Test: certificate chains</h1>
      <p>
        One question for now. Later the test covers every lesson and tells you
        which topics to revisit.
      </p>
      {message !== undefined && (
        <p
          role="alert"
          className="rounded border border-amber-400 bg-amber-50 p-3"
        >
          {message}
        </p>
      )}
      <form action={submitTestAttempt} className="flex flex-col gap-6">
        {QUESTIONS.map((question) => (
          <QuestionFields key={question.id} question={question} />
        ))}
        <button
          type="submit"
          className="self-start rounded bg-black px-4 py-2 text-white"
        >
          Check my answer
        </button>
      </form>
    </main>
  );
}

function QuestionFields({ question }: { question: Question }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 font-medium">{question.prompt}</legend>
      {question.choices.map((choice) => (
        <label key={choice.id} className="flex items-start gap-2">
          <input
            type="radio"
            name={question.id}
            value={choice.id}
            className="mt-1"
          />
          <span>{choice.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

function ResultView({ passed, takenAt }: { passed: boolean; takenAt: Date }) {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">
        {passed ? "You passed" : "Not yet"}
      </h1>
      <p>
        {passed
          ? "Your answer was correct. Your result has been saved."
          : "That answer was not correct. Your attempt has been saved, and you can try again."}
      </p>
      <p className="text-sm text-neutral-600">
        Recorded {takenAt.toISOString()}
      </p>
      <Link href="/test" className="underline">
        {passed ? "Take the test again" : "Try again"}
      </Link>
    </main>
  );
}
