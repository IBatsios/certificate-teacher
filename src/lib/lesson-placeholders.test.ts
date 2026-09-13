import { describe, expect, test } from "vitest";
import type { Lesson } from "@/lib/lesson";
import {
  fillLessonPlaceholders,
  fillPlaceholders,
  placeholdersIn,
} from "@/lib/lesson-placeholders";

const VALUES = { "challenge-token": "3f9a-b2c1-77de-0a45" };

describe("placeholdersIn", () => {
  test("lists each placeholder once, in the order it first appears", () => {
    // Arrange
    const text =
      "Use {{challenge-token}} here, then {{other}} and {{challenge-token}} again.";

    // Act
    const names = placeholdersIn(text);

    // Assert
    expect(names).toEqual(["challenge-token", "other"]);
  });

  test("finds none in plain text, and none in a Go template a docker command carries", () => {
    // The signing step has the student run `docker image inspect --format
    // '{{json .Config.Labels}}'`; those braces are Docker's, not ours.
    expect(placeholdersIn("A Dockerfile is a recipe.")).toEqual([]);
    expect(placeholdersIn("Go templates write {{.Size}}.")).toEqual([]);
    expect(
      placeholdersIn("--format '{{json .Config.Labels}}' my-site:3"),
    ).toEqual([]);
  });
});

describe("fillPlaceholders", () => {
  test("replaces every occurrence of a placeholder with its value", () => {
    // Arrange
    const text =
      'Your token is `{{challenge-token}}`.\n\n```file\nLABEL teacher.challenge="{{challenge-token}}"\n```';

    // Act
    const filled = fillPlaceholders(text, VALUES);

    // Assert
    expect(filled).toBe(
      'Your token is `3f9a-b2c1-77de-0a45`.\n\n```file\nLABEL teacher.challenge="3f9a-b2c1-77de-0a45"\n```',
    );
  });

  test("leaves text without placeholders exactly as it was", () => {
    // Arrange
    const text = "Run `docker build -t my-site:1 .` and read {{.Size}}.";

    // Act
    const filled = fillPlaceholders(text, VALUES);

    // Assert: a Go template in a docker command is not a placeholder.
    expect(filled).toBe(text);
  });

  test("refuses a placeholder it has no value for, naming it", () => {
    // A typo in a lesson file must fail loudly rather than show a student
    // the braces.
    expect(() => fillPlaceholders("{{challenge-tokn}}", VALUES)).toThrow(
      /challenge-tokn/,
    );
  });
});

describe("fillLessonPlaceholders", () => {
  const lesson: Lesson = {
    slug: "build-an-image",
    title: "Build your own image",
    intro: "Intro with {{challenge-token}}.",
    steps: [
      {
        order: 1,
        key: "dockerfile",
        title: "A recipe",
        body: "No token here.",
      },
      {
        order: 6,
        key: "sign",
        title: "Sign your work",
        body: "Add {{challenge-token}} as a label.",
      },
    ],
    finished: { title: "Done", body: "Signed with {{challenge-token}}." },
    courseFinished: null,
  };

  test("fills the intro, every step, and the notes, and leaves the rest alone", () => {
    // Act
    const filled = fillLessonPlaceholders(lesson, VALUES);

    // Assert
    expect(filled.intro).toBe("Intro with 3f9a-b2c1-77de-0a45.");
    expect(filled.steps.map((step) => step.body)).toEqual([
      "No token here.",
      "Add 3f9a-b2c1-77de-0a45 as a label.",
    ]);
    expect(filled.steps.map((step) => step.key)).toEqual([
      "dockerfile",
      "sign",
    ]);
    expect(filled.finished?.body).toBe("Signed with 3f9a-b2c1-77de-0a45.");
    expect(filled.courseFinished).toBeNull();
    expect(filled.slug).toBe("build-an-image");
  });

  test("fills titles as well, so a stray placeholder in one fails rather than shows", () => {
    // Arrange
    const titled: Lesson = {
      ...lesson,
      title: "Sign with {{challenge-token}}",
      steps: [{ ...lesson.steps[1], title: "Step {{challenge-token}}" }],
      finished: { title: "Done {{challenge-token}}", body: "Done." },
    };

    // Act
    const filled = fillLessonPlaceholders(titled, VALUES);

    // Assert
    expect(filled.title).toBe("Sign with 3f9a-b2c1-77de-0a45");
    expect(filled.steps[0].title).toBe("Step 3f9a-b2c1-77de-0a45");
    expect(filled.finished?.title).toBe("Done 3f9a-b2c1-77de-0a45");
    expect(() =>
      fillLessonPlaceholders({ ...lesson, title: "{{nope}}" }, VALUES),
    ).toThrow(/nope/);
  });

  test("returns a new lesson and does not touch the one it was given", () => {
    // Act
    const filled = fillLessonPlaceholders(lesson, VALUES);

    // Assert
    expect(filled).not.toBe(lesson);
    expect(lesson.intro).toBe("Intro with {{challenge-token}}.");
    expect(lesson.steps[1].body).toBe("Add {{challenge-token}} as a label.");
  });
});
