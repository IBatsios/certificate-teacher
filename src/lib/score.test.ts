import { describe, expect, test } from "vitest";
import type { Question } from "@/lib/questions";
import { score, type Answer } from "@/lib/score";

const rootQuestion: Question = {
  id: "trust-anchor",
  prompt:
    "Which certificate in a chain does your browser trust without checking a signature?",
  choices: [
    { id: "root", label: "The root certificate" },
    { id: "leaf", label: "The leaf certificate for the website" },
  ],
  correctChoiceId: "root",
};

describe("score", () => {
  test("passes when the only question is answered correctly", () => {
    // Arrange
    const answers = [{ questionId: "trust-anchor", choiceId: "root" }];

    // Act
    const result = score(answers, [rootQuestion]);

    // Assert
    expect(result).toEqual({ passed: true, correct: 1, total: 1 });
  });

  test("fails when the only question is answered incorrectly", () => {
    // Arrange
    const answers = [{ questionId: "trust-anchor", choiceId: "leaf" }];

    // Act
    const result = score(answers, [rootQuestion]);

    // Assert
    expect(result).toEqual({ passed: false, correct: 0, total: 1 });
  });

  test("fails when no answer is given", () => {
    // Arrange
    const answers: ReadonlyArray<Answer> = [];

    // Act
    const result = score(answers, [rootQuestion]);

    // Assert
    expect(result).toEqual({ passed: false, correct: 0, total: 1 });
  });

  test("ignores an answer to a question that was not asked", () => {
    // Arrange
    const answers = [{ questionId: "not-asked", choiceId: "root" }];

    // Act
    const result = score(answers, [rootQuestion]);

    // Assert
    expect(result).toEqual({ passed: false, correct: 0, total: 1 });
  });
});
