import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ScoreResult } from "@/lib/score";

export type AttemptSummary = Readonly<{
  id: string;
  passed: boolean;
  correct: number;
  total: number;
  /** Topic ids to go back to, in the order they were asked. Empty on a pass. */
  focusAreas: ReadonlyArray<string>;
  createdAt: Date;
}>;

const SUMMARY_SELECT = {
  id: true,
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
 * Records one attempt against the student's active session, creating the
 * session when they have none. Finding the session and writing the attempt
 * share a transaction, so a "start over" from another tab cannot leave the
 * attempt on the session that was just archived.
 *
 * The score is written down rather than recomputed later: the questions and
 * the pass mark can both change, and an old result should still say what the
 * student was told at the time.
 */
export async function recordAttempt(
  userId: string,
  result: ScoreResult,
): Promise<AttemptSummary> {
  return prisma.$transaction(async (tx) => {
    const sessionId = await activeSessionId(tx, userId);
    const row = await tx.testAttempt.create({
      data: {
        userId,
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

/** The attempts in the student's active session, newest first. */
export async function listAttempts(
  userId: string,
): Promise<ReadonlyArray<AttemptSummary>> {
  const session = await prisma.learningSession.findFirst({
    where: { userId, status: "active" },
    select: { id: true },
    orderBy: [{ startedAt: "desc" }, { id: "desc" }],
  });
  if (session === null) {
    return [];
  }
  const rows = await prisma.testAttempt.findMany({
    where: { sessionId: session.id },
    select: SUMMARY_SELECT,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return rows.map(toSummary);
}

/** One attempt of this student's, by id. Null when it is not theirs. */
export async function findAttempt(
  userId: string,
  attemptId: string,
): Promise<AttemptSummary | null> {
  const row = await prisma.testAttempt.findFirst({
    where: { id: attemptId, userId },
    select: SUMMARY_SELECT,
  });
  return row === null ? null : toSummary(row);
}

async function activeSessionId(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<string> {
  const active = await tx.learningSession.findFirst({
    where: { userId, status: "active" },
    select: { id: true },
    orderBy: [{ startedAt: "desc" }, { id: "desc" }],
  });
  if (active !== null) {
    return active.id;
  }
  const created = await tx.learningSession.create({
    data: { userId },
    select: { id: true },
  });
  return created.id;
}

function toSummary(
  row: Prisma.TestAttemptGetPayload<{ select: typeof SUMMARY_SELECT }>,
): AttemptSummary {
  return {
    id: row.id,
    passed: row.passed,
    correct: row.correct,
    total: row.total,
    focusAreas: row.focusAreas,
    createdAt: row.createdAt,
  };
}
