import type { Question } from "@/lib/questions";

export type Answer = Readonly<{
  questionId: string;
  choiceId: string;
}>;

export type ScoreResult = Readonly<{
  passed: boolean;
  correct: number;
  total: number;
}>;

/**
 * Scores a set of answers against the questions that were asked.
 *
 * The skeleton's pass rule is "every question answered correctly". The real
 * pass mark is decided in Task 06 and recorded in docs/DECISIONS.md.
 */
export function score(
  answers: ReadonlyArray<Answer>,
  questions: ReadonlyArray<Question>,
): ScoreResult {
  const correct = questions.filter((question) =>
    isAnsweredCorrectly(question, answers),
  ).length;
  const total = questions.length;

  return { passed: total > 0 && correct === total, correct, total };
}

function isAnsweredCorrectly(
  question: Question,
  answers: ReadonlyArray<Answer>,
): boolean {
  return answers.some(
    (answer) =>
      answer.questionId === question.id &&
      answer.choiceId === question.correctChoiceId,
  );
}
