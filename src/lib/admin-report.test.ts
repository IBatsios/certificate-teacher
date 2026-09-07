import { afterEach, describe, expect, test } from "vitest";
import { buildReport, toCsv, type StudentReportRow } from "@/lib/admin-report";
import { checkCertificate, parseCertificate } from "@/lib/certificate";
import { saveSubmission } from "@/lib/certificate-submission";
import { markStepDone, startOver } from "@/lib/learning-session";
import { prisma } from "@/lib/prisma";
import { recordAttempt } from "@/lib/test-attempt";
import { readFileSync } from "node:fs";
import path from "node:path";

const FIXTURES = path.join(process.cwd(), "src", "lib", "__fixtures__");
const goodLeaf = readFileSync(path.join(FIXTURES, "good-leaf.crt"), "utf8");
const goodRoot = readFileSync(path.join(FIXTURES, "good-root.crt"), "utf8");

async function newStudent(email?: string): Promise<string> {
  const salt = Math.random().toString(36).slice(2, 10);
  const user = await prisma.user.create({
    data: {
      email: email ?? `student-${salt}@report.unit.test`,
      role: "student",
    },
    select: { id: true },
  });
  return user.id;
}

/** The report row for one student, found by their id. */
async function rowFor(userId: string): Promise<StudentReportRow> {
  const rows = await buildReport();
  const row = rows.find((candidate) => candidate.userId === userId);
  if (row === undefined) {
    throw new Error("the student is missing from the report");
  }
  return row;
}

afterEach(async () => {
  await prisma.user.deleteMany({
    where: { email: { endsWith: "@report.unit.test" } },
  });
});

describe("buildReport", () => {
  test("a student who has done nothing still appears, with nothing recorded", async () => {
    // Arrange
    const userId = await newStudent();

    // Act
    const row = await rowFor(userId);

    // Assert
    expect(row.stepsDone).toBe(0);
    expect(row.stepsTotal).toBeGreaterThan(0);
    expect(row.certificateVerdict).toBeNull();
    expect(row.testPassed).toBeNull();
    expect(row.focusAreas).toEqual([]);
  });

  test("counts the lesson steps they have ticked", async () => {
    const userId = await newStudent();
    await markStepDone(userId, "chain");
    await markStepDone(userId, "root");

    const row = await rowFor(userId);

    expect(row.stepsDone).toBe(2);
    expect(row.courseComplete).toBe(false);
  });

  test("shows the latest certificate verdict", async () => {
    // Arrange
    const userId = await newStudent();
    const parsed = parseCertificate(goodLeaf);
    if (!parsed.ok) throw new Error("fixture did not parse");
    await saveSubmission(
      userId,
      parsed.certificate,
      checkCertificate(goodLeaf, goodRoot),
    );

    // Act
    const row = await rowFor(userId);

    // Assert
    expect(row.certificateVerdict).toBe("passed");
    expect(row.certificateAt).toBeInstanceOf(Date);
  });

  test("shows the latest test result with its focus areas named", async () => {
    // Arrange
    const userId = await newStudent();
    await recordAttempt(userId, {
      passed: false,
      correct: 9,
      total: 16,
      topics: [],
      focusAreas: ["proxy", "java"],
    });

    // Act
    const row = await rowFor(userId);

    // Assert
    expect(row.testPassed).toBe(false);
    expect(row.testCorrect).toBe(9);
    expect(row.testTotal).toBe(16);
    // Titles, not ids: the admin should not have to know the topic keys.
    expect(row.focusAreas).toEqual(["The reverse proxy", "The Java keystore"]);
  });

  test("only the newest attempt counts", async () => {
    const userId = await newStudent();
    await recordAttempt(userId, {
      passed: false,
      correct: 4,
      total: 16,
      topics: [],
      focusAreas: ["java"],
    });
    await recordAttempt(userId, {
      passed: true,
      correct: 16,
      total: 16,
      topics: [],
      focusAreas: [],
    });

    const row = await rowFor(userId);

    expect(row.testPassed).toBe(true);
    expect(row.focusAreas).toEqual([]);
  });

  /** The report follows the active session, which "start over" replaces (D33). */
  test("starting over empties the row, without deleting what came before", async () => {
    // Arrange
    const userId = await newStudent();
    await markStepDone(userId, "chain");
    await recordAttempt(userId, {
      passed: true,
      correct: 16,
      total: 16,
      topics: [],
      focusAreas: [],
    });

    // Act
    await startOver(userId);

    // Assert
    const row = await rowFor(userId);
    expect(row.stepsDone).toBe(0);
    expect(row.testPassed).toBeNull();
    expect(await prisma.testAttempt.count({ where: { userId } })).toBe(1);
  });

  test("the admin is not listed as a student", async () => {
    // Arrange
    const salt = Math.random().toString(36).slice(2, 10);
    const admin = await prisma.user.create({
      data: { email: `admin-${salt}@report.unit.test`, role: "admin" },
      select: { id: true },
    });

    // Act
    const rows = await buildReport();

    // Assert
    expect(rows.some((row) => row.userId === admin.id)).toBe(false);
  });
});

describe("toCsv", () => {
  function row(overrides: Partial<StudentReportRow> = {}): StudentReportRow {
    return {
      userId: "u1",
      email: "student@example.com",
      signedUpAt: new Date("2026-09-01T10:00:00Z"),
      stepsDone: 5,
      stepsTotal: 9,
      courseComplete: false,
      certificateVerdict: "passed",
      certificateAt: new Date("2026-09-02T10:00:00Z"),
      testPassed: false,
      testCorrect: 9,
      testTotal: 16,
      focusAreas: ["The reverse proxy"],
      testAt: new Date("2026-09-03T10:00:00Z"),
      ...overrides,
    };
  }

  test("starts with a header naming every column", () => {
    const [header] = toCsv([row()]).split("\r\n");

    expect(header).toContain("email");
    expect(header).toContain("focus areas");
  });

  test("writes one line per student", () => {
    const csv = toCsv([row({ userId: "a" }), row({ userId: "b" })]);

    expect(csv.trimEnd().split("\r\n")).toHaveLength(3);
  });

  test("quotes a field holding a comma, and doubles a quote inside one", () => {
    const csv = toCsv([
      row({ focusAreas: ["The reverse proxy", "The Java keystore"] }),
      row({ email: 'od"d@example.com' }),
    ]);

    expect(csv).toContain('"The reverse proxy, The Java keystore"');
    expect(csv).toContain('"od""d@example.com"');
  });

  test("nothing recorded reads as empty, not as the word null", () => {
    const csv = toCsv([
      row({
        certificateVerdict: null,
        certificateAt: null,
        testPassed: null,
        testCorrect: null,
        testTotal: null,
        testAt: null,
        focusAreas: [],
      }),
    ]);

    expect(csv).not.toContain("null");
    expect(csv).not.toContain("undefined");
  });

  /**
   * A student chooses their own email, and the sign-up validator accepts one
   * beginning with + or -. A spreadsheet treats a cell starting with = + - or
   * @ as a formula, so the export would run it when the admin opened the file.
   */
  test.each([
    ["=cmd|'/c calc'!A1@example.com"],
    ["+49@example.com"],
    ["-2+3@example.com"],
    ["@SUM(1)@example.com"],
  ])("defuses %s so a spreadsheet will not run it", (email) => {
    const csv = toCsv([row({ email })]);
    const field = csv.split("\r\n")[1] ?? "";

    // The address is still readable, but no cell begins with a formula
    // character once the quoting is stripped.
    expect(field).toContain(email);
    for (const cell of field.split(",")) {
      expect(cell.replace(/^"/, "")[0]).not.toMatch(/[=+\-@]/);
    }
  });

  test("a lone tab or carriage return cannot start a cell either", () => {
    const csv = toCsv([row({ email: "\tstudent@example.com" })]);

    expect(csv.split("\r\n")[1]?.replace(/^"/, "")[0]).not.toBe("\t");
  });
});
