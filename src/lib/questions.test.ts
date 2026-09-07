import { describe, expect, test } from "vitest";
import {
  loadQuestionBank,
  parseQuestionBank,
  QUESTIONS_PER_TOPIC_MINIMUM,
  withShuffledChoices,
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

describe("withShuffledChoices", () => {
  /** A random() that walks a fixed list, so a shuffle is reproducible. */
  function sequence(values: ReadonlyArray<number>): () => number {
    let index = 0;
    return () => values[index++ % values.length] ?? 0;
  }

  const question = {
    id: "one",
    topic: "chains",
    prompt: "A question?",
    choices: [
      { id: "a", label: "First" },
      { id: "b", label: "Second" },
      { id: "c", label: "Third" },
    ],
    correctChoiceId: "a",
  };

  test("offers exactly the same choices, in some order", () => {
    // Act
    const [shuffled] = withShuffledChoices([question], sequence([0.9, 0.1]));

    // Assert
    expect(shuffled?.choices.map((choice) => choice.id).sort()).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(shuffled?.correctChoiceId).toBe("a");
  });

  test("different randomness puts them in a different order", () => {
    const [one] = withShuffledChoices([question], sequence([0, 0]));
    const [two] = withShuffledChoices([question], sequence([0.99, 0.99]));

    expect(one?.choices.map((choice) => choice.id)).not.toEqual(
      two?.choices.map((choice) => choice.id),
    );
  });

  test("leaves the question it was given untouched", () => {
    // Arrange: the bank is loaded once and shared, so shuffling must not
    // rewrite it for the next request.
    const before = question.choices.map((choice) => choice.id);

    withShuffledChoices([question], sequence([0.5, 0.5]));

    expect(question.choices.map((choice) => choice.id)).toEqual(before);
  });

  test("every choice survives, over many shuffles", () => {
    for (let run = 0; run < 200; run += 1) {
      const [shuffled] = withShuffledChoices([question]);
      expect(shuffled?.choices).toHaveLength(3);
      expect(new Set(shuffled?.choices.map((choice) => choice.id)).size).toBe(
        3,
      );
    }
  });
});

describe("the bank on disk does not give the answer away by position", () => {
  /**
   * The page shuffles on every render, so this is not what protects the test.
   * It is here because the first version of the bank had the correct answer
   * first in all sixteen questions, and clicking the first option every time
   * scored full marks.
   */
  test("the correct answers are not all in one position", async () => {
    const bank = await loadQuestionBank();

    const positions = bank.questions.map((question) =>
      question.choices.findIndex(
        (choice) => choice.id === question.correctChoiceId,
      ),
    );

    expect(new Set(positions).size).toBeGreaterThan(1);
  });
});
