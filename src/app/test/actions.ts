"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { PLACEHOLDER_STUDENT_KEY } from "@/lib/placeholder-student";
import { prisma } from "@/lib/prisma";
import { QUESTIONS, type Question } from "@/lib/questions";
import { score, type Answer, type ScoreResult } from "@/lib/score";
import { testPageWithMessage } from "./messages";

// One form field per question, named by the question id, holding a choice id.
// The choice must be one the question actually offers.
const submissionSchema = z.object(byQuestionId(choiceSchemaFor));

function byQuestionId<T>(
  valueFor: (question: Question) => T,
): Record<string, T> {
  return Object.fromEntries(
    QUESTIONS.map((question) => [question.id, valueFor(question)]),
  );
}

function choiceSchemaFor(question: Question) {
  return z
    .string()
    .refine((choiceId) =>
      question.choices.some((choice) => choice.id === choiceId),
    );
}

function readRawAnswers(formData: FormData): Record<string, unknown> {
  return byQuestionId((question) => formData.get(question.id));
}

function toAnswers(data: Record<string, string>): ReadonlyArray<Answer> {
  return Object.entries(data).map(([questionId, choiceId]) => ({
    questionId,
    choiceId,
  }));
}

async function recordAttempt(result: ScoreResult): Promise<string | null> {
  try {
    const attempt = await prisma.testAttempt.create({
      data: { studentKey: PLACEHOLDER_STUDENT_KEY, passed: result.passed },
      select: { id: true },
    });
    return attempt.id;
  } catch (error) {
    console.error("Could not save the test attempt", error);
    return null;
  }
}

/**
 * Scores the submitted answers, records the attempt, and sends the student to
 * the result. Redirects happen outside try/catch because `redirect` throws.
 */
export async function submitTestAttempt(formData: FormData): Promise<void> {
  const parsed = submissionSchema.safeParse(readRawAnswers(formData));
  if (!parsed.success) {
    redirect(testPageWithMessage("unanswered"));
  }

  const result = score(toAnswers(parsed.data), QUESTIONS);
  const attemptId = await recordAttempt(result);
  if (attemptId === null) {
    redirect(testPageWithMessage("not-saved"));
  }

  redirect(`/test?attempt=${attemptId}`);
}
