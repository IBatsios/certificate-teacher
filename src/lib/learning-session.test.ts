import { afterEach, describe, expect, test } from "vitest";
import {
  listArchivedSessions,
  markStepDone,
  markStepNotDone,
  startOrResume,
  startOver,
} from "@/lib/learning-session";
import { prisma } from "@/lib/prisma";

// These run against the development database. Each test makes its own user
// and the cleanup below removes them, which cascades to their sessions.
async function newStudent(): Promise<string> {
  const salt = Math.random().toString(36).slice(2, 10);
  const user = await prisma.user.create({
    data: { email: `student-${salt}@session.unit.test`, role: "student" },
    select: { id: true },
  });
  return user.id;
}

afterEach(async () => {
  await prisma.user.deleteMany({
    where: { email: { endsWith: "@session.unit.test" } },
  });
});

describe("startOrResume", () => {
  test("a new student gets an empty active session", async () => {
    // Arrange
    const userId = await newStudent();

    // Act
    const session = await startOrResume(userId);

    // Assert
    expect(session.status).toBe("active");
    expect(session.doneStepKeys).toEqual([]);
    expect(session.archivedAt).toBeNull();
  });

  test("coming back resumes the same session", async () => {
    // Arrange
    const userId = await newStudent();
    const first = await startOrResume(userId);

    // Act
    const second = await startOrResume(userId);

    // Assert
    expect(second.id).toBe(first.id);
  });
});

describe("markStepDone and markStepNotDone", () => {
  test("a done step is remembered, and doing it again changes nothing", async () => {
    // Arrange
    const userId = await newStudent();

    // Act
    await markStepDone(userId, "chain");
    const session = await markStepDone(userId, "chain");

    // Assert
    expect(session.doneStepKeys).toEqual(["chain"]);
  });

  test("steps come back in the order they were done", async () => {
    // Arrange
    const userId = await newStudent();

    // Act
    await markStepDone(userId, "root");
    const session = await markStepDone(userId, "chain");

    // Assert
    expect(session.doneStepKeys).toEqual(["root", "chain"]);
  });

  test("a step can be un-done, and un-doing an undone step is harmless", async () => {
    // Arrange
    const userId = await newStudent();
    await markStepDone(userId, "chain");
    await markStepDone(userId, "openssl");

    // Act
    await markStepNotDone(userId, "chain");
    const session = await markStepNotDone(userId, "chain");

    // Assert
    expect(session.doneStepKeys).toEqual(["openssl"]);
  });
});

describe("startOver", () => {
  test("archives the old session with its steps and starts an empty one", async () => {
    // Arrange
    const userId = await newStudent();
    const old = await markStepDone(userId, "chain");

    // Act
    const fresh = await startOver(userId);
    const resumed = await startOrResume(userId);
    const archived = await listArchivedSessions(userId);

    // Assert
    expect(fresh.id).not.toBe(old.id);
    expect(fresh.doneStepKeys).toEqual([]);
    expect(resumed.id).toBe(fresh.id);
    expect(archived).toHaveLength(1);
    expect(archived[0]).toMatchObject({
      id: old.id,
      status: "archived",
      doneStepKeys: ["chain"],
    });
    expect(archived[0]?.archivedAt).toBeInstanceOf(Date);
  });

  test("starting over twice lists both old sessions, newest first", async () => {
    // Arrange
    const userId = await newStudent();
    const first = await startOrResume(userId);
    const second = await startOver(userId);

    // Act
    await startOver(userId);
    const archived = await listArchivedSessions(userId);

    // Assert
    expect(archived.map((session) => session.id)).toEqual([
      second.id,
      first.id,
    ]);
  });
});

describe("sessions belong to one student", () => {
  test("another student sees none of them", async () => {
    // Arrange
    const alice = await newStudent();
    const bob = await newStudent();
    await markStepDone(alice, "chain");
    await startOver(alice);

    // Act
    const bobsSession = await startOrResume(bob);
    const bobsArchive = await listArchivedSessions(bob);

    // Assert
    expect(bobsSession.doneStepKeys).toEqual([]);
    expect(bobsArchive).toEqual([]);
  });
});
