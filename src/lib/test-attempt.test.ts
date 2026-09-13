import { afterEach, describe, expect, test } from "vitest";
import { CERTIFICATES_COURSE } from "@/lib/courses";
import { startOrResume, startOver } from "@/lib/learning-session";
import { prisma } from "@/lib/prisma";
import type { ScoreResult } from "@/lib/score";
import { findAttempt, listAttempts, recordAttempt } from "@/lib/test-attempt";

// Against the development database, like the other data-access tests. Each
// test makes its own user; the cleanup removes only this file's users, which
// cascades to their sessions and attempts.

const COURSE = CERTIFICATES_COURSE.id;

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
    const attempt = await recordAttempt(userId, COURSE, passing());

    // Assert
    expect(attempt.passed).toBe(true);
    expect(attempt.correct).toBe(16);
    expect(attempt.total).toBe(16);
    expect(attempt.focusAreas).toEqual([]);
  });

  test("writes down which course's test it was, on the attempt itself", async () => {
    // Arrange: the report across courses reads the course off the attempt,
    // not through the session, so an attempt with no session still says.
    const userId = await newStudent();

    // Act
    const attempt = await recordAttempt(userId, "another-course", passing());

    // Assert
    expect(attempt.courseId).toBe("another-course");
    const row = await prisma.testAttempt.findUniqueOrThrow({
      where: { id: attempt.id },
      select: { courseId: true, session: { select: { courseId: true } } },
    });
    expect(row.courseId).toBe("another-course");
    expect(row.session?.courseId).toBe("another-course");
  });

  test("keeps the focus areas of a failed attempt", async () => {
    const userId = await newStudent();

    const attempt = await recordAttempt(
      userId,
      COURSE,
      failing(["proxy", "java"]),
    );

    expect(attempt.passed).toBe(false);
    expect(attempt.focusAreas).toEqual(["proxy", "java"]);
  });

  test("attaches the attempt to the student's active session", async () => {
    // Arrange
    const userId = await newStudent();
    const session = await startOrResume(userId, COURSE);

    // Act
    await recordAttempt(userId, COURSE, passing());

    // Assert
    const rows = await prisma.testAttempt.findMany({
      where: { sessionId: session.id },
    });
    expect(rows).toHaveLength(1);
  });

  test("a student with no session yet gets one", async () => {
    const userId = await newStudent();

    const attempt = await recordAttempt(userId, COURSE, passing());

    expect(attempt.id).toBeTruthy();
    const rows = await prisma.testAttempt.findMany({ where: { userId } });
    expect(rows[0]?.sessionId).not.toBeNull();
  });
});

describe("listAttempts", () => {
  test("a student who has not taken it has none", async () => {
    const userId = await newStudent();

    expect(await listAttempts(userId, COURSE)).toEqual([]);
  });

  test("newest first", async () => {
    // Arrange
    const userId = await newStudent();
    await recordAttempt(userId, COURSE, failing(["java"]));
    await recordAttempt(userId, COURSE, passing());

    // Act
    const attempts = await listAttempts(userId, COURSE);

    // Assert
    expect(attempts).toHaveLength(2);
    expect(attempts[0]?.passed).toBe(true);
    expect(attempts[1]?.passed).toBe(false);
  });

  test("an attempt in one course is not listed for another", async () => {
    // Arrange
    const userId = await newStudent();
    await recordAttempt(userId, "another-course", passing());

    // Act
    const here = await listAttempts(userId, COURSE);

    // Assert
    expect(here).toEqual([]);
    expect(await listAttempts(userId, "another-course")).toHaveLength(1);
  });

  test("starting over leaves the earlier attempts behind, without deleting them", async () => {
    // Arrange
    const userId = await newStudent();
    await recordAttempt(userId, COURSE, passing());

    // Act
    await startOver(userId, COURSE);

    // Assert
    expect(await listAttempts(userId, COURSE)).toEqual([]);
    expect(await prisma.testAttempt.count({ where: { userId } })).toBe(1);
  });
});

describe("findAttempt", () => {
  test("finds the student's own attempt in the course", async () => {
    // Arrange
    const userId = await newStudent();
    const recorded = await recordAttempt(userId, COURSE, passing());

    // Act
    const found = await findAttempt(userId, COURSE, recorded.id);

    // Assert
    expect(found?.id).toBe(recorded.id);
  });

  test("is null for another student's attempt", async () => {
    // Arrange
    const alice = await newStudent();
    const bob = await newStudent();
    const recorded = await recordAttempt(alice, COURSE, passing());

    // Act
    const found = await findAttempt(bob, COURSE, recorded.id);

    // Assert
    expect(found).toBeNull();
  });

  test("is null for an attempt at another course's test", async () => {
    // Arrange: the result page reads the focus areas against the course's
    // own topics, so an attempt from another course must not be shown there.
    const userId = await newStudent();
    const recorded = await recordAttempt(userId, "another-course", passing());

    // Act
    const found = await findAttempt(userId, COURSE, recorded.id);

    // Assert
    expect(found).toBeNull();
  });
});
