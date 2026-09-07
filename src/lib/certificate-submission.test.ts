import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { checkCertificate, parseCertificate } from "@/lib/certificate";
import { listSubmissions, saveSubmission } from "@/lib/certificate-submission";
import { startOrResume, startOver } from "@/lib/learning-session";
import { prisma } from "@/lib/prisma";

// These run against the development database, like the learning-session tests.
// Each test makes its own user and the cleanup below removes them, which
// cascades to their sessions and submissions.

const FIXTURES = path.join(process.cwd(), "src", "lib", "__fixtures__");
const goodLeaf = readFileSync(path.join(FIXTURES, "good-leaf.crt"), "utf8");
const goodRoot = readFileSync(path.join(FIXTURES, "good-root.crt"), "utf8");
const expiredLeaf = readFileSync(
  path.join(FIXTURES, "expired-leaf.crt"),
  "utf8",
);

async function newStudent(): Promise<string> {
  const salt = Math.random().toString(36).slice(2, 10);
  const user = await prisma.user.create({
    data: { email: `student-${salt}@certificate.unit.test`, role: "student" },
    select: { id: true },
  });
  return user.id;
}

/** Parses and judges a pair the way the page does, then stores the outcome. */
async function submit(userId: string, leafPem: string) {
  const parsed = parseCertificate(leafPem);
  if (!parsed.ok) {
    throw new Error(`fixture did not parse: ${parsed.reason}`);
  }
  const report = checkCertificate(leafPem, goodRoot);
  return saveSubmission(userId, parsed.certificate, report);
}

/** Every submission this student has made, across all their sessions. */
async function countFor(userId: string): Promise<number> {
  return prisma.certificateSubmission.count({
    where: { session: { userId } },
  });
}

afterEach(async () => {
  await prisma.user.deleteMany({
    where: { email: { endsWith: "@certificate.unit.test" } },
  });
});

describe("saveSubmission", () => {
  test("keeps what the student was shown", async () => {
    // Arrange
    const userId = await newStudent();

    // Act
    const submission = await submit(userId, goodLeaf);

    // Assert
    expect(submission.verdict).toBe("passed");
    expect(submission.failedChecks).toEqual([]);
    expect(submission.subject).toContain("CN=localhost");
    expect(submission.issuer).toContain("CN=My Root");
  });

  test("records which checks failed, so an old verdict still reads the same", async () => {
    const userId = await newStudent();

    const submission = await submit(userId, expiredLeaf);

    expect(submission.verdict).toBe("failed");
    expect(submission.failedChecks).toEqual(["leaf-in-date"]);
  });

  test("attaches the submission to the student's active session", async () => {
    // Arrange
    const userId = await newStudent();
    const session = await startOrResume(userId);

    // Act
    await submit(userId, goodLeaf);

    // Assert
    const rows = await prisma.certificateSubmission.findMany({
      where: { sessionId: session.id },
    });
    expect(rows).toHaveLength(1);
  });

  /** A private key must never reach this function, so it refuses one outright. */
  test("refuses to store anything holding a private key", async () => {
    const userId = await newStudent();
    const parsed = parseCertificate(goodLeaf);
    if (!parsed.ok) throw new Error("fixture did not parse");
    const withKey = {
      ...parsed.certificate,
      pem: `${goodLeaf}\n-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----\n`,
    };

    await expect(
      saveSubmission(userId, withKey, checkCertificate(goodLeaf, goodRoot)),
    ).rejects.toThrow(/private key/i);

    expect(await countFor(userId)).toBe(0);
  });
});

describe("listSubmissions", () => {
  test("a student with none has none", async () => {
    const userId = await newStudent();

    expect(await listSubmissions(userId)).toEqual([]);
  });

  test("newest first", async () => {
    // Arrange
    const userId = await newStudent();
    await submit(userId, expiredLeaf);
    await submit(userId, goodLeaf);

    // Act
    const submissions = await listSubmissions(userId);

    // Assert
    expect(submissions).toHaveLength(2);
    expect(submissions[0]?.verdict).toBe("passed");
    expect(submissions[1]?.verdict).toBe("failed");
  });

  test("starting over leaves the earlier submissions behind", async () => {
    // Arrange: submissions belong to the session they were made in (D33).
    const userId = await newStudent();
    await submit(userId, goodLeaf);

    // Act
    await startOver(userId);

    // Assert
    expect(await listSubmissions(userId)).toEqual([]);
    // Still on the archived session, not deleted (D33).
    expect(await countFor(userId)).toBe(1);
  });
});
