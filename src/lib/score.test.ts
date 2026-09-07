import { describe, expect, test } from "vitest";
import { loadQuestionBank, type Question } from "@/lib/questions";
import { passMarkFor, score, type Answer } from "@/lib/score";

/** Four questions on one topic, answered "right" or "wrong" by id. */
function questionsFor(topic: string, count: number): ReadonlyArray<Question> {
  return Array.from({ length: count }, (_unused, index) => ({
    id: `${topic}-${index}`,
    topic,
    prompt: `${topic} question ${index}?`,
    choices: [
      { id: "right", label: "The right one" },
      { id: "wrong", label: "The wrong one" },
    ],
    correctChoiceId: "right",
  }));
}

/** Answers `rightCount` of a topic's questions correctly and the rest wrongly. */
function answersFor(
  questions: ReadonlyArray<Question>,
  rightCount: number,
): ReadonlyArray<Answer> {
  return questions.map((question, index) => ({
    questionId: question.id,
    choiceId: index < rightCount ? "right" : "wrong",
  }));
}

describe("passMarkFor", () => {
  test("three of four, rounding up so a part-right topic is not passed", () => {
    expect(passMarkFor(4)).toBe(3);
    expect(passMarkFor(3)).toBe(3);
    expect(passMarkFor(8)).toBe(6);
  });
});

describe("score, one topic", () => {
  const questions = questionsFor("chains", 4);

  test.each([
    [4, true],
    [3, true],
    [2, false],
    [0, false],
  ])("%i of 4 right means passed = %s", (rightCount, expected) => {
    // Act
    const result = score(answersFor(questions, rightCount), questions);

    // Assert
    expect(result.passed).toBe(expected);
    expect(result.correct).toBe(rightCount);
    expect(result.total).toBe(4);
  });

  test("an unanswered question is simply not correct", () => {
    const result = score([], questions);

    expect(result.correct).toBe(0);
    expect(result.passed).toBe(false);
  });

  test("an answer to a question that was not asked is ignored", () => {
    const answers = [
      ...answersFor(questions, 4),
      { questionId: "not-asked", choiceId: "right" },
    ];

    const result = score(answers, questions);

    expect(result.correct).toBe(4);
    expect(result.total).toBe(4);
  });
});

describe("score, several topics", () => {
  const chains = questionsFor("chains", 4);
  const java = questionsFor("java", 4);
  const questions = [...chains, ...java];

  test("knowing everything passes, with nothing to go back to", () => {
    // Act
    const result = score(
      [...answersFor(chains, 4), ...answersFor(java, 4)],
      questions,
    );

    // Assert
    expect(result.passed).toBe(true);
    expect(result.focusAreas).toEqual([]);
  });

  /**
   * The point of the rule. A flat percentage would pass this: 5 of 8 is not
   * far off, and every wrong answer sits in one topic the student plainly
   * does not know.
   */
  test("knowing one topic and not the other fails, and names the one missed", () => {
    // Arrange: all four chains questions right, one java question right.
    const answers = [...answersFor(chains, 4), ...answersFor(java, 1)];

    // Act
    const result = score(answers, questions);

    // Assert
    expect(result.passed).toBe(false);
    expect(result.focusAreas).toEqual(["java"]);
    expect(result.correct).toBe(5);
  });

  test("missing both topics names both, in the order they were asked", () => {
    const answers = [...answersFor(chains, 0), ...answersFor(java, 0)];

    const result = score(answers, questions);

    expect(result.focusAreas).toEqual(["chains", "java"]);
  });

  test("a slip in each topic still passes", () => {
    // Arrange: three of four in both, which is the pass mark.
    const answers = [...answersFor(chains, 3), ...answersFor(java, 3)];

    const result = score(answers, questions);

    expect(result.passed).toBe(true);
    expect(result.correct).toBe(6);
  });

  test("reports each topic separately", () => {
    const result = score(
      [...answersFor(chains, 4), ...answersFor(java, 2)],
      questions,
    );

    expect(result.topics).toEqual([
      { topicId: "chains", correct: 4, total: 4, passed: true },
      { topicId: "java", correct: 2, total: 4, passed: false },
    ]);
  });

  test("no questions is not a pass", () => {
    expect(score([], []).passed).toBe(false);
  });
});

describe("score, against the real question bank", () => {
  test("answering everything correctly passes every topic", async () => {
    // Arrange
    const bank = await loadQuestionBank();
    const answers = bank.questions.map((question) => ({
      questionId: question.id,
      choiceId: question.correctChoiceId,
    }));

    // Act
    const result = score(answers, bank.questions);

    // Assert
    expect(result.passed).toBe(true);
    expect(result.correct).toBe(bank.questions.length);
    expect(result.focusAreas).toEqual([]);
  });

  test("answering nothing fails every topic the course teaches", async () => {
    const bank = await loadQuestionBank();

    const result = score([], bank.questions);

    expect(result.passed).toBe(false);
    expect(result.focusAreas).toEqual(["chains", "browser", "proxy", "java"]);
  });
});
