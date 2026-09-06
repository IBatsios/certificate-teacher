import { describe, expect, test } from "vitest";
import { loadLesson, parseStep } from "@/lib/lesson";

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
