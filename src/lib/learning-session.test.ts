import { afterEach, describe, expect, test } from "vitest";
import { CERTIFICATES_COURSE } from "@/lib/courses";
import {
  findActiveSessionId,
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

const COURSE = CERTIFICATES_COURSE.id;
// A second course, so the tests prove the scoping rather than the catalog.
// The session functions take any id: which courses exist is the catalog's
// business, and the callers pass ids from it.
const OTHER_COURSE = "another-course";

afterEach(async () => {
  await prisma.user.deleteMany({
    where: { email: { endsWith: "@session.unit.test" } },
  });
});

describe("startOrResume", () => {
  test("a new student gets an empty active session in the course", async () => {
    // Arrange
    const userId = await newStudent();

    // Act
    const session = await startOrResume(userId, COURSE);

    // Assert
    expect(session.status).toBe("active");
    expect(session.courseId).toBe(COURSE);
    expect(session.doneStepKeys).toEqual([]);
    expect(session.archivedAt).toBeNull();
  });

  test("coming back resumes the same session", async () => {
    // Arrange
    const userId = await newStudent();
    const first = await startOrResume(userId, COURSE);

    // Act
    const second = await startOrResume(userId, COURSE);

    // Assert
    expect(second.id).toBe(first.id);
  });
});

describe("markStepDone and markStepNotDone", () => {
  test("a done step is remembered, and doing it again changes nothing", async () => {
    // Arrange
    const userId = await newStudent();

    // Act
    await markStepDone(userId, COURSE, "chain");
    const session = await markStepDone(userId, COURSE, "chain");

    // Assert
    expect(session.doneStepKeys).toEqual(["chain"]);
  });

  test("steps come back in the order they were done", async () => {
    // Arrange
    const userId = await newStudent();

    // Act
    await markStepDone(userId, COURSE, "root");
    const session = await markStepDone(userId, COURSE, "chain");

    // Assert
    expect(session.doneStepKeys).toEqual(["root", "chain"]);
  });

  test("a step can be un-done, and un-doing an undone step is harmless", async () => {
    // Arrange
    const userId = await newStudent();
    await markStepDone(userId, COURSE, "chain");
    await markStepDone(userId, COURSE, "openssl");

    // Act
    await markStepNotDone(userId, COURSE, "chain");
    const session = await markStepNotDone(userId, COURSE, "chain");

    // Assert
    expect(session.doneStepKeys).toEqual(["openssl"]);
  });
});

describe("startOver", () => {
  test("archives the old session with its steps and starts an empty one", async () => {
    // Arrange
    const userId = await newStudent();
    const old = await markStepDone(userId, COURSE, "chain");

    // Act
    const fresh = await startOver(userId, COURSE);
    const resumed = await startOrResume(userId, COURSE);
    const archived = await listArchivedSessions(userId, COURSE);

    // Assert
    expect(fresh.id).not.toBe(old.id);
    expect(fresh.courseId).toBe(COURSE);
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
    const first = await startOrResume(userId, COURSE);
    const second = await startOver(userId, COURSE);

    // Act
    await startOver(userId, COURSE);
    const archived = await listArchivedSessions(userId, COURSE);

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
    await markStepDone(alice, COURSE, "chain");
    await startOver(alice, COURSE);

    // Act
    const bobsSession = await startOrResume(bob, COURSE);
    const bobsArchive = await listArchivedSessions(bob, COURSE);

    // Assert
    expect(bobsSession.doneStepKeys).toEqual([]);
    expect(bobsArchive).toEqual([]);
  });
});

describe("sessions belong to one course", () => {
  test("a student has a separate active session in each course", async () => {
    // Arrange
    const userId = await newStudent();

    // Act
    const certificates = await markStepDone(userId, COURSE, "chain");
    const other = await startOrResume(userId, OTHER_COURSE);

    // Assert: a step ticked in one course is not ticked in the other.
    expect(other.id).not.toBe(certificates.id);
    expect(other.courseId).toBe(OTHER_COURSE);
    expect(other.doneStepKeys).toEqual([]);
    expect((await startOrResume(userId, COURSE)).doneStepKeys).toEqual([
      "chain",
    ]);
  });

  test("starting over in one course leaves the other course's run alone", async () => {
    // Arrange: the rule is one active session per student per course, so a
    // fresh start on the second course must not archive the first.
    const userId = await newStudent();
    const certificates = await markStepDone(userId, COURSE, "chain");
    await startOrResume(userId, OTHER_COURSE);

    // Act
    await startOver(userId, OTHER_COURSE);

    // Assert
    const resumed = await startOrResume(userId, COURSE);
    expect(resumed.id).toBe(certificates.id);
    expect(resumed.status).toBe("active");
    expect(resumed.doneStepKeys).toEqual(["chain"]);
    expect(await listArchivedSessions(userId, COURSE)).toEqual([]);
    expect(await listArchivedSessions(userId, OTHER_COURSE)).toHaveLength(1);
  });
});

describe("findActiveSessionId", () => {
  test("is null until the student starts the course", async () => {
    // Arrange
    const userId = await newStudent();
    await startOrResume(userId, OTHER_COURSE);

    // Act
    const found = await findActiveSessionId(userId, COURSE);

    // Assert: a session in another course does not count, and asking does
    // not create one.
    expect(found).toBeNull();
    expect(await prisma.learningSession.count({ where: { userId } })).toBe(1);
  });

  test("names the active session once there is one", async () => {
    // Arrange
    const userId = await newStudent();
    const session = await startOrResume(userId, COURSE);

    // Act
    const found = await findActiveSessionId(userId, COURSE);

    // Assert
    expect(found).toBe(session.id);
  });
});
