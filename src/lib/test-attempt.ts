import { Prisma } from "@/generated/prisma/client";
import { activeSessionId, findActiveSessionId } from "@/lib/learning-session";
import { prisma } from "@/lib/prisma";
import type { ScoreResult } from "@/lib/score";

export type AttemptSummary = Readonly<{
  id: string;
  /** Which course's test it was, by the id in `src/lib/courses.ts`. */
  courseId: string;
  passed: boolean;
  correct: number;
  total: number;
  /** Topic ids to go back to, in the order they were asked. Empty on a pass. */
  focusAreas: ReadonlyArray<string>;
  createdAt: Date;
}>;

const SUMMARY_SELECT = {
  id: true,
  courseId: true,
  passed: true,
  correct: true,
  total: true,
  focusAreas: true,
  createdAt: true,
} satisfies Prisma.TestAttemptSelect;

const SERIALIZABLE = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
};

/**
 * Records one attempt at the course's test against the student's active
 * session in that course, creating the session when they have none. Finding
 * the session and writing the attempt share a transaction, so a "start over"
 * from another tab cannot leave the attempt on the session that was just
 * archived.
 *
 * The score is written down rather than recomputed later: the questions and
 * the pass mark can both change, and an old result should still say what the
 * student was told at the time.
 */
export async function recordAttempt(
  userId: string,
  courseId: string,
  result: ScoreResult,
): Promise<AttemptSummary> {
  return prisma.$transaction(async (tx) => {
    const sessionId = await activeSessionId(tx, userId, courseId);
    const row = await tx.testAttempt.create({
      data: {
        userId,
        courseId,
        sessionId,
        passed: result.passed,
        correct: result.correct,
        total: result.total,
        focusAreas: [...result.focusAreas],
      },
      select: SUMMARY_SELECT,
    });
    return toSummary(row);
  }, SERIALIZABLE);
}

/** The attempts in the student's active session in the course, newest first. */
export async function listAttempts(
  userId: string,
  courseId: string,
): Promise<ReadonlyArray<AttemptSummary>> {
  const sessionId = await findActiveSessionId(userId, courseId);
  if (sessionId === null) {
    return [];
  }
  const rows = await prisma.testAttempt.findMany({
    where: { sessionId },
    select: SUMMARY_SELECT,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return rows.map(toSummary);
}

/**
 * One attempt of this student's at this course's test, by id. Null when it is
 * not theirs or not this course's: the result page names the focus areas
 * with the course's own topic titles, so an attempt from another course
 * would read wrong there.
 */
export async function findAttempt(
  userId: string,
  courseId: string,
  attemptId: string,
): Promise<AttemptSummary | null> {
  const row = await prisma.testAttempt.findFirst({
    where: { id: attemptId, userId, courseId },
    select: SUMMARY_SELECT,
  });
  return row === null ? null : toSummary(row);
}

function toSummary(
  row: Prisma.TestAttemptGetPayload<{ select: typeof SUMMARY_SELECT }>,
): AttemptSummary {
  return {
    id: row.id,
    courseId: row.courseId,
    passed: row.passed,
    correct: row.correct,
    total: row.total,
    focusAreas: row.focusAreas,
    createdAt: row.createdAt,
  };
}
