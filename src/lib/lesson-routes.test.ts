import { describe, expect, test } from "vitest";
import {
  isLessonMessageKey,
  LESSON_MESSAGES,
  lessonMessageFor,
  lessonPath,
  lessonPathAtStep,
  lessonPathWithMessage,
} from "@/lib/lesson-routes";

describe("lessonPath", () => {
  test("addresses a lesson by its slug", () => {
    expect(lessonPath("certificates")).toBe("/lessons/certificates");
    expect(lessonPath("deploy")).toBe("/lessons/deploy");
  });
});

describe("lessonPathWithMessage", () => {
  test("carries the message key in the query string", () => {
    // Act
    const path = lessonPathWithMessage("deploy", "started-over");

    // Assert
    expect(path).toBe("/lessons/deploy?message=started-over");
  });
});

describe("lessonPathAtStep", () => {
  test("points at one step of the lesson", () => {
    expect(lessonPathAtStep("certificates", "root")).toBe(
      "/lessons/certificates#step-root",
    );
  });

  test("escapes a step key that would otherwise change the URL", () => {
    // Arrange: no lesson uses a key like this, so the escaping is a guard,
    // not something the content relies on.
    const path = lessonPathAtStep("deploy", "a b#c");

    // Assert
    expect(path).toBe("/lessons/deploy#step-a%20b%23c");
  });
});

describe("isLessonMessageKey", () => {
  test("recognises the keys the lesson pages can show", () => {
    expect(isLessonMessageKey("not-saved")).toBe(true);
    expect(isLessonMessageKey("unknown-step")).toBe(true);
    expect(isLessonMessageKey("started-over")).toBe(true);
  });

  test("rejects anything else, including a value from the query string", () => {
    expect(isLessonMessageKey("nonsense")).toBe(false);
    expect(isLessonMessageKey("")).toBe(false);
    expect(isLessonMessageKey("toString")).toBe(false);
  });
});

describe("lessonMessageFor", () => {
  test("turns a key from the query string into what the student reads", () => {
    // Act
    const message = lessonMessageFor("started-over");

    // Assert
    expect(message).toBe(LESSON_MESSAGES["started-over"]);
  });

  test("takes the first value when the query string repeats the parameter", () => {
    expect(lessonMessageFor(["not-saved", "started-over"])).toBe(
      LESSON_MESSAGES["not-saved"],
    );
  });

  test("has nothing to say for a missing or unknown value", () => {
    expect(lessonMessageFor(undefined)).toBeUndefined();
    expect(lessonMessageFor("nonsense")).toBeUndefined();
    expect(lessonMessageFor([])).toBeUndefined();
  });
});
