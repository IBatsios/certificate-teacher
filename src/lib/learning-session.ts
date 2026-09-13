import { Prisma } from "@/generated/prisma/client";
import type { SessionStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

// A student's runs through a course. Every function here takes the course as
// well as the student, because the rule is one active session per student
// per course (D71): a fresh start on one course must not archive, and cannot
// resume, a run in another. Which courses exist is the catalog's business in
// `src/lib/courses.ts`; the callers pass an id from it.

export type SessionSummary = Readonly<{
  id: string;
  /** The course the session is in, by the id in `src/lib/courses.ts`. */
  courseId: string;
  status: SessionStatus;
  startedAt: Date;
  archivedAt: Date | null;
  /** Step keys in the order they were ticked. */
  doneStepKeys: ReadonlyArray<string>;
}>;

const SUMMARY_SELECT = {
  id: true,
  courseId: true,
  status: true,
  startedAt: true,
  archivedAt: true,
  steps: { select: { stepKey: true }, orderBy: { doneAt: "asc" } },
} satisfies Prisma.LearningSessionSelect;

type SessionRow = Prisma.LearningSessionGetPayload<{
  select: typeof SUMMARY_SELECT;
}>;

const SERIALIZABLE = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
};

const NEWEST_FIRST = [
  { startedAt: "desc" },
  { id: "desc" },
] satisfies Prisma.LearningSessionOrderByWithRelationInput[];

type Tx = Prisma.TransactionClient;

/**
 * The student's active session in the course, created when they have none.
 * One transaction at serializable isolation, so two requests arriving
 * together cannot both create one (the rule from D28).
 */
export function startOrResume(
  userId: string,
  courseId: string,
): Promise<SessionSummary> {
  return prisma.$transaction(
    async (tx) => toSummary(await activeSession(tx, userId, courseId)),
    SERIALIZABLE,
  );
}

/**
 * Ticks a step in the active session. Ticking a ticked step changes nothing.
 * Finding the session and writing the tick share one transaction, so a
 * "start over" from another tab cannot slip in between and leave the tick on
 * the session that was just archived.
 */
export function markStepDone(
  userId: string,
  courseId: string,
  stepKey: string,
): Promise<SessionSummary> {
  return prisma.$transaction(async (tx) => {
    const session = await activeSession(tx, userId, courseId);
    await tx.stepProgress.upsert({
      where: { sessionId_stepKey: { sessionId: session.id, stepKey } },
      create: { sessionId: session.id, stepKey },
      update: {},
    });
    return reload(tx, session.id);
  }, SERIALIZABLE);
}

/** Un-ticks a step in the active session. Harmless when it was not ticked. */
export function markStepNotDone(
  userId: string,
  courseId: string,
  stepKey: string,
): Promise<SessionSummary> {
  return prisma.$transaction(async (tx) => {
    const session = await activeSession(tx, userId, courseId);
    await tx.stepProgress.deleteMany({
      where: { sessionId: session.id, stepKey },
    });
    return reload(tx, session.id);
  }, SERIALIZABLE);
}

/**
 * Archives the active session in the course, steps and all, and starts an
 * empty one in the same course. The student's runs in other courses are not
 * touched. Nothing is deleted: the old session stays listed and recoverable
 * (D33).
 */
export function startOver(
  userId: string,
  courseId: string,
): Promise<SessionSummary> {
  return prisma.$transaction(async (tx) => {
    await tx.learningSession.updateMany({
      where: activeIn(userId, courseId),
      data: { status: "archived", archivedAt: new Date() },
    });
    const created = await tx.learningSession.create({
      data: { userId, courseId },
      select: SUMMARY_SELECT,
    });
    return toSummary(created);
  }, SERIALIZABLE);
}

/** The student's earlier sessions in the course, newest first. */
export async function listArchivedSessions(
  userId: string,
  courseId: string,
): Promise<ReadonlyArray<SessionSummary>> {
  const rows = await prisma.learningSession.findMany({
    where: { userId, courseId, status: "archived" },
    select: SUMMARY_SELECT,
    orderBy: NEWEST_FIRST,
  });
  return rows.map(toSummary);
}

/**
 * The id of the student's active session in the course, or null when they
 * have not started it. Creates nothing and runs in no transaction: this is
 * for reading what belongs to the session, not for writing to it.
 */
export async function findActiveSessionId(
  userId: string,
  courseId: string,
): Promise<string | null> {
  const active = await prisma.learningSession.findFirst({
    where: activeIn(userId, courseId),
    select: { id: true },
    orderBy: NEWEST_FIRST,
  });
  return active?.id ?? null;
}

/**
 * The id of the student's active session in the course, created when there
 * is none. Runs inside the caller's transaction, so that finding the session
 * and writing something that belongs to it (a submission, a test attempt)
 * cannot be split by a "start over" from another tab.
 */
export async function activeSessionId(
  tx: Tx,
  userId: string,
  courseId: string,
): Promise<string> {
  const row = await findOrCreateActive(tx, userId, courseId, { id: true });
  return row.id;
}

/** The active session row, created when there is none. Inside a transaction. */
function activeSession(
  tx: Tx,
  userId: string,
  courseId: string,
): Promise<SessionRow> {
  return findOrCreateActive(tx, userId, courseId, SUMMARY_SELECT);
}

async function findOrCreateActive<S extends Prisma.LearningSessionSelect>(
  tx: Tx,
  userId: string,
  courseId: string,
  select: S,
): Promise<Prisma.LearningSessionGetPayload<{ select: S }>> {
  const active = await tx.learningSession.findFirst({
    where: activeIn(userId, courseId),
    select,
    orderBy: NEWEST_FIRST,
  });
  if (active !== null) {
    return active;
  }
  return tx.learningSession.create({ data: { userId, courseId }, select });
}

function activeIn(userId: string, courseId: string) {
  return { userId, courseId, status: "active" as const };
}

async function reload(tx: Tx, id: string): Promise<SessionSummary> {
  const row = await tx.learningSession.findUniqueOrThrow({
    where: { id },
    select: SUMMARY_SELECT,
  });
  return toSummary(row);
}

function toSummary(row: SessionRow): SessionSummary {
  return {
    id: row.id,
    courseId: row.courseId,
    status: row.status,
    startedAt: row.startedAt,
    archivedAt: row.archivedAt,
    doneStepKeys: row.steps.map((step) => step.stepKey),
  };
}
