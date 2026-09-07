import type { CertificateVerdict } from "@/generated/prisma/enums";
import { loadLesson } from "@/lib/lesson";
import { courseProgress } from "@/lib/lesson-progress";
import { COURSE_SLUGS } from "@/lib/lesson-routes";
import { prisma } from "@/lib/prisma";
import { loadQuestionBank } from "@/lib/questions";

// What the admin sees: one row per student, drawn from their active session.
// A student who has started over reads as empty here, because the run they are
// on is empty; the old run is kept and is never deleted (D33, D62).

export type StudentReportRow = Readonly<{
  userId: string;
  email: string;
  signedUpAt: Date;
  stepsDone: number;
  stepsTotal: number;
  courseComplete: boolean;
  /** The latest certificate verdict, or null when none was submitted. */
  certificateVerdict: CertificateVerdict | null;
  certificateAt: Date | null;
  /** The latest attempt, or null when the test was never taken. */
  testPassed: boolean | null;
  testCorrect: number | null;
  testTotal: number | null;
  /** Topic titles to go back to, not topic ids. Empty on a pass or no attempt. */
  focusAreas: ReadonlyArray<string>;
  testAt: Date | null;
}>;

/**
 * Every student, with their active session's progress and latest results.
 *
 * The session, its steps, and the newest submission and attempt are nested in
 * one `findMany`, which Prisma runs as one statement per table: five in total,
 * whether there are six students or six hundred. Measured, not assumed.
 * Listing students and then asking about each would be a query per student.
 */
export async function buildReport(): Promise<ReadonlyArray<StudentReportRow>> {
  const [students, lessons, bank] = await Promise.all([
    prisma.user.findMany({
      where: { role: "student" },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        email: true,
        createdAt: true,
        learningSessions: {
          where: { status: "active" },
          orderBy: [{ startedAt: "desc" }, { id: "desc" }],
          take: 1,
          select: {
            steps: { select: { stepKey: true } },
            submissions: {
              orderBy: [{ createdAt: "desc" }, { id: "desc" }],
              take: 1,
              select: { verdict: true, createdAt: true },
            },
            testAttempts: {
              orderBy: [{ createdAt: "desc" }, { id: "desc" }],
              take: 1,
              select: {
                passed: true,
                correct: true,
                total: true,
                focusAreas: true,
                createdAt: true,
              },
            },
          },
        },
      },
    }),
    Promise.all(COURSE_SLUGS.map((slug) => loadLesson(slug))),
    loadQuestionBank(),
  ]);

  const titleOf = new Map(bank.topics.map((topic) => [topic.id, topic.title]));

  return students.map((student) => {
    const session = student.learningSessions[0];
    const done = new Set(session?.steps.map((step) => step.stepKey) ?? []);
    const progress = courseProgress(lessons, done);
    const submission = session?.submissions[0];
    const attempt = session?.testAttempts[0];

    return {
      userId: student.id,
      email: student.email,
      signedUpAt: student.createdAt,
      stepsDone: progress.done,
      stepsTotal: progress.total,
      courseComplete: progress.isComplete,
      certificateVerdict: submission?.verdict ?? null,
      certificateAt: submission?.createdAt ?? null,
      testPassed: attempt?.passed ?? null,
      testCorrect: attempt?.correct ?? null,
      testTotal: attempt?.total ?? null,
      focusAreas: (attempt?.focusAreas ?? []).map(
        (topicId) => titleOf.get(topicId) ?? topicId,
      ),
      testAt: attempt?.createdAt ?? null,
    };
  });
}

const COLUMNS: ReadonlyArray<
  Readonly<{ header: string; of: (row: StudentReportRow) => string }>
> = [
  { header: "email", of: (row) => row.email },
  { header: "signed up", of: (row) => isoDate(row.signedUpAt) },
  { header: "steps done", of: (row) => String(row.stepsDone) },
  { header: "steps total", of: (row) => String(row.stepsTotal) },
  { header: "course complete", of: (row) => yesNo(row.courseComplete) },
  { header: "certificate", of: (row) => row.certificateVerdict ?? "" },
  { header: "certificate checked", of: (row) => isoDate(row.certificateAt) },
  {
    header: "test",
    of: (row) =>
      row.testPassed === null ? "" : row.testPassed ? "passed" : "failed",
  },
  {
    header: "test score",
    of: (row) =>
      row.testCorrect === null || row.testTotal === null
        ? ""
        : `${row.testCorrect} of ${row.testTotal}`,
  },
  { header: "focus areas", of: (row) => row.focusAreas.join(", ") },
  { header: "test taken", of: (row) => isoDate(row.testAt) },
];

/** The file name the export downloads as, with the day in it. */
export function exportFileName(now: Date = new Date()): string {
  return `teacher-progress-${now.toISOString().slice(0, 10)}.csv`;
}

/**
 * The report as CSV. Pure.
 *
 * Fields are quoted when they hold a comma, a quote, or a line break, and a
 * quote inside a field is doubled, which is what RFC 4180 asks for.
 *
 * A field that would otherwise begin with `=`, `+`, `-`, `@`, a tab, or a
 * carriage return is prefixed with an apostrophe. Spreadsheets read those as
 * the start of a formula, and a student picks their own email address: the
 * sign-up validator accepts `+49@example.com` and `-2+3@example.com`, so
 * without this the admin opening the file would be running something a
 * student wrote.
 */
export function toCsv(rows: ReadonlyArray<StudentReportRow>): string {
  const lines = [
    COLUMNS.map((column) => escapeField(column.header)).join(","),
    ...rows.map((row) =>
      COLUMNS.map((column) => escapeField(column.of(row))).join(","),
    ),
  ];
  // CRLF, which RFC 4180 specifies and Excel is happiest with.
  return `${lines.join("\r\n")}\r\n`;
}

const FORMULA_START = /^[=+\-@\t\r]/;
const NEEDS_QUOTES = /[",\r\n]/;

function escapeField(value: string): string {
  const defused = FORMULA_START.test(value) ? `'${value}` : value;
  return NEEDS_QUOTES.test(defused)
    ? `"${defused.replaceAll('"', '""')}"`
    : defused;
}

function isoDate(value: Date | null): string {
  return value === null ? "" : value.toISOString().slice(0, 10);
}

function yesNo(value: boolean): string {
  return value ? "yes" : "no";
}
