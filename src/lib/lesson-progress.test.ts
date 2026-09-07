import { describe, expect, test } from "vitest";
import { courseProgress, lessonProgress } from "@/lib/lesson-progress";

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

describe("courseProgress", () => {
  const certificates = { steps: [{ key: "chain" }, { key: "root" }] };
  const deploy = { steps: [{ key: "browser" }, { key: "proxy" }] };
  const course = [certificates, deploy];

  test("counts every step of every lesson", () => {
    // Act
    const progress = courseProgress(course, new Set<string>());

    // Assert
    expect(progress).toEqual({ done: 0, total: 4, isComplete: false });
  });

  test("finishing one lesson is not finishing the course", () => {
    // Arrange: every certificates step, no deploy step.
    const done = new Set(["chain", "root"]);

    // Act
    const progress = courseProgress(course, done);

    // Assert
    expect(progress).toEqual({ done: 2, total: 4, isComplete: false });
  });

  test("the course is complete once both lessons are", () => {
    // Arrange
    const done = new Set(["chain", "root", "browser", "proxy"]);

    // Act
    const progress = courseProgress(course, done);

    // Assert
    expect(progress).toEqual({ done: 4, total: 4, isComplete: true });
  });

  test("a step key no lesson uses any more does not count", () => {
    // Arrange: a session ticked a step that has since left the content.
    const done = new Set(["chain", "root", "browser", "proxy", "retired-step"]);

    // Act
    const progress = courseProgress(course, done);

    // Assert
    expect(progress.done).toBe(4);
    expect(progress.total).toBe(4);
  });

  test("a course with no steps is not complete", () => {
    // Arrange: guards against 0 === 0 reading as finished.
    const progress = courseProgress([], new Set<string>());

    // Assert
    expect(progress.isComplete).toBe(false);
  });
});
