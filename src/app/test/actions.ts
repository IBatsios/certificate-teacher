"use server";

import { redirect } from "next/navigation";
import { loadQuestionBank, type Question } from "@/lib/questions";
import { score, type Answer } from "@/lib/score";
import { requireRole } from "@/lib/session";
import { recordAttempt } from "@/lib/test-attempt";
import { testPageWithMessage } from "./messages";

/**
 * Scores the submitted answers, records the attempt, and sends the student to
 * the result. Redirects happen outside try/catch because `redirect` throws.
 *
 * Every question must be answered. A part-finished test would be scored as
 * though the missing answers were wrong, which is a harsher verdict than the
 * student intended to ask for.
 */
export async function submitTestAttempt(formData: FormData): Promise<void> {
  const student = await requireRole("student");
  const bank = await loadQuestionBank();

  const answers = readAnswers(formData, bank.questions);
  if (answers === null) {
    redirect(testPageWithMessage("unanswered"));
  }

  const result = score(answers, bank.questions);

  let attemptId: string | null = null;
  try {
    attemptId = (await recordAttempt(student.id, result)).id;
  } catch (error) {
    console.error("Could not save the test attempt", error);
  }
  if (attemptId === null) {
    redirect(testPageWithMessage("not-saved"));
  }

  redirect(`/test?attempt=${attemptId}`);
}

/**
 * One answer per question, or null unless every question was answered with a
 * choice it actually offers. Anything else is a form that did not come from
 * the page as rendered.
 */
function readAnswers(
  formData: FormData,
  questions: ReadonlyArray<Question>,
): ReadonlyArray<Answer> | null {
  const answers: Answer[] = [];
  for (const question of questions) {
    const choiceId = formData.get(question.id);
    if (typeof choiceId !== "string") {
      return null;
    }
    const offered = question.choices.some((choice) => choice.id === choiceId);
    if (!offered) {
      return null;
    }
    answers.push({ questionId: question.id, choiceId });
  }
  return answers;
}
