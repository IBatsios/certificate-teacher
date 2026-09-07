import type { Question } from "@/lib/questions";

export type Answer = Readonly<{
  questionId: string;
  choiceId: string;
}>;

export type TopicScore = Readonly<{
  topicId: string;
  correct: number;
  total: number;
  passed: boolean;
}>;

export type ScoreResult = Readonly<{
  passed: boolean;
  correct: number;
  total: number;
  /** One entry per topic that was asked about, in the order asked. */
  topics: ReadonlyArray<TopicScore>;
  /** The topics not passed, in the same order. Empty when the test is passed. */
  focusAreas: ReadonlyArray<string>;
}>;

/**
 * The share of a topic's questions that must be right for that topic to count
 * as known. Three of four (D58).
 */
export const TOPIC_PASS_RATIO = 0.75;

/**
 * Scores answers by topic, and says which topics to go back to.
 *
 * The pass rule is one rule, not two: a topic is passed when at least
 * `TOPIC_PASS_RATIO` of its questions are right, and the test is passed when
 * every topic is. That makes the verdict and the focus areas the same fact,
 * so they can never disagree, and it means nobody passes while knowing
 * nothing about one part of the course (D58).
 */
export function score(
  answers: ReadonlyArray<Answer>,
  questions: ReadonlyArray<Question>,
): ScoreResult {
  const topics = topicsInOrder(questions).map((topicId) =>
    scoreTopic(topicId, answers, questions),
  );

  const correct = topics.reduce((total, topic) => total + topic.correct, 0);
  const total = questions.length;
  const focusAreas = topics
    .filter((topic) => !topic.passed)
    .map((topic) => topic.topicId);

  return {
    passed: topics.length > 0 && focusAreas.length === 0,
    correct,
    total,
    topics,
    focusAreas,
  };
}

/** How many of a topic's questions must be right for it to be passed. */
export function passMarkFor(total: number): number {
  return Math.ceil(total * TOPIC_PASS_RATIO);
}

function topicsInOrder(
  questions: ReadonlyArray<Question>,
): ReadonlyArray<string> {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const question of questions) {
    if (!seen.has(question.topic)) {
      seen.add(question.topic);
      order.push(question.topic);
    }
  }
  return order;
}

function scoreTopic(
  topicId: string,
  answers: ReadonlyArray<Answer>,
  questions: ReadonlyArray<Question>,
): TopicScore {
  const asked = questions.filter((question) => question.topic === topicId);
  const correct = asked.filter((question) =>
    isAnsweredCorrectly(question, answers),
  ).length;
  return {
    topicId,
    correct,
    total: asked.length,
    passed: correct >= passMarkFor(asked.length),
  };
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
