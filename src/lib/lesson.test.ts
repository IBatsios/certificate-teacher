import { describe, expect, test } from "vitest";
import path from "node:path";
import {
  loadCourseLessons,
  loadLesson,
  parseNote,
  parseStep,
} from "@/lib/lesson";
import { placeholdersIn } from "@/lib/lesson-placeholders";

// Lessons written for these tests alone, so a shape the real content does not
// have (a lesson with no finished note) can still be loaded.
const FIXTURE_LESSONS = path.join(
  process.cwd(),
  "src",
  "lib",
  "__fixtures__",
  "lessons",
);

describe("parseStep", () => {
  test("reads the key and title from the header and keeps the body", () => {
    // Arrange
    const text = "---\nkey: root\ntitle: Make your root\n---\n\nSome text.\n";

    // Act
    const step = parseStep("03-make-your-root.md", text);

    // Assert
    expect(step).toEqual({
      order: 3,
      key: "root",
      title: "Make your root",
      body: "Some text.",
    });
  });

  test("refuses a file without a key or a title", () => {
    // Arrange
    const text = "---\ntitle: Make your root\n---\nSome text.\n";

    // Act
    const parse = () => parseStep("03-make-your-root.md", text);

    // Assert
    expect(parse).toThrow(/key/);
  });

  test("refuses a file name without a leading number", () => {
    // Arrange
    const text = "---\nkey: root\ntitle: Make your root\n---\nSome text.\n";

    // Act
    const parse = () => parseStep("make-your-root.md", text);

    // Assert
    expect(parse).toThrow(/number/);
  });
});

describe("loadLesson for the certificates lesson", () => {
  test("has a title and five steps in file order with distinct keys", async () => {
    // Act
    const lesson = await loadLesson("certificates");

    // Assert
    expect(lesson.title.length).toBeGreaterThan(0);
    expect(lesson.steps.map((step) => step.order)).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(lesson.steps.map((step) => step.key)).size).toBe(5);
    for (const step of lesson.steps) {
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.body.length).toBeGreaterThan(0);
    }
  });

  test("refuses a slug that is not a plain folder name", async () => {
    // Act
    const loads = ["../certificates", "certificates/..", "Certificates"].map(
      (slug) => loadLesson(slug),
    );

    // Assert
    for (const load of loads) {
      await expect(load).rejects.toThrow(/not valid/);
    }
  });

  test("refuses a lesson that does not exist", async () => {
    // Act
    const load = loadLesson("no-such-lesson");

    // Assert
    await expect(load).rejects.toThrow(/no-such-lesson/);
  });
});

describe("loadLesson for the containers lesson", () => {
  test("has five steps with distinct keys, and a note that links to lesson 2", async () => {
    // Act
    const lesson = await loadLesson("containers");

    // Assert: the first lesson of the Docker course. Its note pointed at
    // lesson 2 without a link while that would have been a 404 (D73); the
    // link arrived with the lesson.
    expect(lesson.title.length).toBeGreaterThan(0);
    expect(lesson.steps.map((step) => step.order)).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(lesson.steps.map((step) => step.key)).size).toBe(5);
    expect(lesson.finished?.body).toMatch(/Lesson 2/);
    expect(lesson.finished?.body).toContain("(/lessons/build-an-image)");
    // Only the last lesson of a course carries the course note.
    expect(lesson.courseFinished).toBeNull();
  });
});

describe("loadLesson for the build-an-image lesson", () => {
  test("has six steps with the keys progress is stored under, and a note that names lesson 3 without linking to it", async () => {
    // Act
    const lesson = await loadLesson("build-an-image");

    // Assert: the second lesson of the Docker course. Lesson 3 is not
    // written yet, so the note says it is coming rather than pointing at a
    // 404, as the containers note did for this lesson.
    expect(lesson.title).toBe("Build your own image");
    expect(lesson.steps.map((step) => step.order)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(lesson.steps.map((step) => step.key)).toEqual([
      "dockerfile",
      "layers",
      "dockerignore",
      "tags",
      "smaller",
      "sign",
    ]);
    expect(lesson.finished?.body).toMatch(/Lesson 3/);
    expect(lesson.finished?.body).not.toMatch(/\]\(/);
    expect(lesson.courseFinished).toBeNull();
  });

  test("asks the page for the challenge token, and for nothing else", async () => {
    // Arrange: the page fills `{{challenge-token}}`; any other placeholder
    // would fail at render, so the content is checked here first.
    const lesson = await loadLesson("build-an-image");
    const texts = [
      lesson.intro,
      ...lesson.steps.map((step) => step.body),
      lesson.finished?.body ?? "",
    ];

    // Act
    const names = new Set(texts.flatMap((text) => placeholdersIn(text)));

    // Assert: shown in the signing step, and in the Dockerfile it gives.
    expect([...names]).toEqual(["challenge-token"]);
    const signing = lesson.steps.find((step) => step.key === "sign");
    expect(placeholdersIn(signing?.body ?? "")).toEqual(["challenge-token"]);
  });
});

describe("loadCourseLessons", () => {
  test("loads a course's lessons in the order the catalog lists them", async () => {
    // Arrange
    const course = { lessonSlugs: ["deploy", "certificates"] };

    // Act
    const lessons = await loadCourseLessons(course);

    // Assert
    expect(lessons.map((lesson) => lesson.slug)).toEqual([
      "deploy",
      "certificates",
    ]);
  });

  test("a course with no lessons yet loads none", async () => {
    // A coming-soon course names no lesson, and asking is not an error.
    await expect(loadCourseLessons({ lessonSlugs: [] })).resolves.toEqual([]);
  });
});

describe("parseNote", () => {
  test("reads the title from the header and keeps the body as markdown", () => {
    // Arrange
    const text = `---
title: Every step is done
---

Go to [the next one](/lessons/deploy).
`;

    // Act
    const note = parseNote("finished.md", text);

    // Assert
    expect(note).toEqual({
      title: "Every step is done",
      body: "Go to [the next one](/lessons/deploy).",
    });
  });

  test("refuses a note without a title", () => {
    expect(() =>
      parseNote(
        "finished.md",
        `Just a body.
`,
      ),
    ).toThrow(/finished\.md.*title/);
  });
});

describe("loadLesson and the finished notes", () => {
  test("the certificates lesson says what to do next, and nothing about the course", async () => {
    // Act
    const lesson = await loadLesson("certificates");

    // Assert: the note that was JSX on the page, now content beside the steps.
    expect(lesson.finished?.title).toBe("Every step is done");
    expect(lesson.finished?.body).toContain("(/lessons/deploy)");
    expect(lesson.finished?.body).toContain("(/lessons/verify)");
    expect(lesson.courseFinished).toBeNull();
  });

  test("the deploy lesson has a note for the lesson and one for the whole course", async () => {
    // Act
    const lesson = await loadLesson("deploy");

    // Assert
    expect(lesson.finished?.title).toBe("Every step of this lesson is done");
    expect(lesson.finished?.body).toContain("(/lessons/certificates)");
    expect(lesson.courseFinished?.title).toBe("That is the whole course");
    expect(lesson.courseFinished?.body).toContain("(/test)");
  });

  test("a lesson with no note is valid, and has none", async () => {
    // Act: the page then shows its plain "every step is done" line.
    const lesson = await loadLesson("bare", FIXTURE_LESSONS);

    // Assert
    expect(lesson.steps.map((step) => step.key)).toEqual(["only"]);
    expect(lesson.finished).toBeNull();
    expect(lesson.courseFinished).toBeNull();
  });
});
