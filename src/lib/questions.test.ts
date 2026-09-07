import { describe, expect, test } from "vitest";
import {
  loadQuestionBank,
  parseQuestionBank,
  QUESTIONS_PER_TOPIC_MINIMUM,
} from "@/lib/questions";

/** A bank small enough to read, valid in every way the parser cares about. */
function validBank() {
  return {
    topics: [{ id: "chains", title: "Certificate chains" }],
    questions: [
      {
        id: "one",
        topic: "chains",
        prompt: "A question?",
        choices: [
          { id: "a", label: "First" },
          { id: "b", label: "Second" },
        ],
        correctChoiceId: "a",
      },
    ],
  };
}

describe("parseQuestionBank", () => {
  test("reads topics and questions", () => {
    // Act
    const bank = parseQuestionBank(validBank());

    // Assert
    expect(bank.topics).toHaveLength(1);
    expect(bank.questions[0]?.topic).toBe("chains");
  });

  test.each([
    ["not an object", 42],
    ["no topics", { questions: [] }],
    ["no questions", { topics: [] }],
  ])("refuses a bank that is %s", (_name, input) => {
    expect(() => parseQuestionBank(input)).toThrow();
  });

  /**
   * The failures worth catching are the ones a hand edit makes: a typo in a
   * topic name, a correct answer that is not one of the choices, a duplicated
   * id. None of these are type errors, and all of them silently break scoring.
   */
  test("refuses a question whose topic is not declared", () => {
    const bank = validBank();
    bank.questions[0].topic = "chian";

    expect(() => parseQuestionBank(bank)).toThrow(/topic/i);
  });

  test("refuses a correct answer that is not one of the choices", () => {
    const bank = validBank();
    bank.questions[0].correctChoiceId = "z";

    expect(() => parseQuestionBank(bank)).toThrow(/correct/i);
  });

  test("refuses two questions sharing an id", () => {
    const bank = validBank();
    bank.questions.push({ ...bank.questions[0]! });

    expect(() => parseQuestionBank(bank)).toThrow(/twice|duplicate/i);
  });

  test("refuses two choices sharing an id within one question", () => {
    const bank = validBank();
    bank.questions[0].choices.push({ id: "a", label: "First again" });

    expect(() => parseQuestionBank(bank)).toThrow(/twice|duplicate/i);
  });

  test("refuses a question with only one choice", () => {
    const bank = validBank();
    bank.questions[0].choices = [{ id: "a", label: "Only" }];

    expect(() => parseQuestionBank(bank)).toThrow();
  });
});

describe("the question bank on disk", () => {
  test("loads, and every topic has enough questions to be scored", async () => {
    // Act
    const bank = await loadQuestionBank();

    // Assert
    expect(bank.topics.length).toBeGreaterThan(0);
    for (const topic of bank.topics) {
      const asked = bank.questions.filter(
        (question) => question.topic === topic.id,
      );
      expect(asked.length, topic.id).toBeGreaterThanOrEqual(
        QUESTIONS_PER_TOPIC_MINIMUM,
      );
    }
  });

  test("covers the four topics the course teaches", async () => {
    const bank = await loadQuestionBank();

    expect(bank.topics.map((topic) => topic.id)).toEqual([
      "chains",
      "browser",
      "proxy",
      "java",
    ]);
  });

  test("no topic is declared that nothing asks about", async () => {
    const bank = await loadQuestionBank();
    const asked = new Set(bank.questions.map((question) => question.topic));

    for (const topic of bank.topics) {
      expect(asked.has(topic.id), topic.id).toBe(true);
    }
  });
});
