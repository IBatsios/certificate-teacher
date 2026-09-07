import { afterEach, describe, expect, test } from "vitest";
import { startOrResume, startOver } from "@/lib/learning-session";
import { prisma } from "@/lib/prisma";
import type { ScoreResult } from "@/lib/score";
import { listAttempts, recordAttempt } from "@/lib/test-attempt";

// Against the development database, like the other data-access tests. Each
// test makes its own user; the cleanup removes only this file's users, which
// cascades to their sessions and attempts.

async function newStudent(): Promise<string> {
  const salt = Math.random().toString(36).slice(2, 10);
  const user = await prisma.user.create({
    data: { email: `student-${salt}@attempt.unit.test`, role: "student" },
    select: { id: true },
  });
  return user.id;
}

function passing(): ScoreResult {
  return {
    passed: true,
    correct: 16,
    total: 16,
    topics: [{ topicId: "chains", correct: 4, total: 4, passed: true }],
    focusAreas: [],
  };
}

function failing(focusAreas: ReadonlyArray<string>): ScoreResult {
  return {
    passed: false,
    correct: 9,
    total: 16,
    topics: [{ topicId: "java", correct: 1, total: 4, passed: false }],
    focusAreas,
  };
}

afterEach(async () => {
  await prisma.user.deleteMany({
    where: { email: { endsWith: "@attempt.unit.test" } },
  });
});

describe("recordAttempt", () => {
  test("keeps the verdict and the score as it was judged", async () => {
    // Arrange
    const userId = await newStudent();

    // Act
    const attempt = await recordAttempt(userId, passing());

    // Assert
    expect(attempt.passed).toBe(true);
    expect(attempt.correct).toBe(16);
    expect(attempt.total).toBe(16);
    expect(attempt.focusAreas).toEqual([]);
  });

  test("keeps the focus areas of a failed attempt", async () => {
    const userId = await newStudent();

    const attempt = await recordAttempt(userId, failing(["proxy", "java"]));

    expect(attempt.passed).toBe(false);
    expect(attempt.focusAreas).toEqual(["proxy", "java"]);
  });

  test("attaches the attempt to the student's active session", async () => {
    // Arrange
    const userId = await newStudent();
    const session = await startOrResume(userId);

    // Act
    await recordAttempt(userId, passing());

    // Assert
    const rows = await prisma.testAttempt.findMany({
      where: { sessionId: session.id },
    });
    expect(rows).toHaveLength(1);
  });

  test("a student with no session yet gets one", async () => {
    const userId = await newStudent();

    const attempt = await recordAttempt(userId, passing());

    expect(attempt.id).toBeTruthy();
    const rows = await prisma.testAttempt.findMany({ where: { userId } });
    expect(rows[0]?.sessionId).not.toBeNull();
  });
});

describe("listAttempts", () => {
  test("a student who has not taken it has none", async () => {
    const userId = await newStudent();

    expect(await listAttempts(userId)).toEqual([]);
  });

  test("newest first", async () => {
    // Arrange
    const userId = await newStudent();
    await recordAttempt(userId, failing(["java"]));
    await recordAttempt(userId, passing());

    // Act
    const attempts = await listAttempts(userId);

    // Assert
    expect(attempts).toHaveLength(2);
    expect(attempts[0]?.passed).toBe(true);
    expect(attempts[1]?.passed).toBe(false);
  });

  test("starting over leaves the earlier attempts behind, without deleting them", async () => {
    // Arrange
    const userId = await newStudent();
    await recordAttempt(userId, passing());

    // Act
    await startOver(userId);

    // Assert
    expect(await listAttempts(userId)).toEqual([]);
    expect(await prisma.testAttempt.count({ where: { userId } })).toBe(1);
  });
});
