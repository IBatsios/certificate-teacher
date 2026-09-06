import { describe, expect, test } from "vitest";
import { lessonProgress } from "@/lib/lesson-progress";

const steps = [{ key: "chain" }, { key: "openssl" }, { key: "root" }];

describe("lessonProgress", () => {
  test("a fresh session has nothing done and the first step next", () => {
    // Arrange
    const done = new Set<string>();

    // Act
    const progress = lessonProgress(steps, done);

    // Assert
    expect(progress).toEqual({
      done: 0,
      total: 3,
      nextStepKey: "chain",
      isComplete: false,
    });
  });

  test("the next step is the first one not done, in lesson order", () => {
    // Arrange
    const done = new Set(["chain", "root"]);

    // Act
    const progress = lessonProgress(steps, done);

    // Assert
    expect(progress).toEqual({
      done: 2,
      total: 3,
      nextStepKey: "openssl",
      isComplete: false,
    });
  });

  test("every step done means complete with no next step", () => {
    // Arrange
    const done = new Set(["chain", "openssl", "root"]);

    // Act
    const progress = lessonProgress(steps, done);

    // Assert
    expect(progress).toEqual({
      done: 3,
      total: 3,
      nextStepKey: null,
      isComplete: true,
    });
  });

  test("done keys that are not steps are ignored", () => {
    // Arrange
    const done = new Set(["chain", "retired-step"]);

    // Act
    const progress = lessonProgress(steps, done);

    // Assert
    expect(progress.done).toBe(1);
  });
});
