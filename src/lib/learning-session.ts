import { Prisma } from "@/generated/prisma/client";
import type { SessionStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export type SessionSummary = Readonly<{
  id: string;
  status: SessionStatus;
  startedAt: Date;
  archivedAt: Date | null;
  /** Step keys in the order they were ticked. */
  doneStepKeys: ReadonlyArray<string>;
}>;

const SUMMARY_SELECT = {
  id: true,
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

type Tx = Prisma.TransactionClient;

/**
 * The student's active session, created when they have none. One transaction
 * at serializable isolation, so two requests arriving together cannot both
 * create one (the rule from D28).
 */
export function startOrResume(userId: string): Promise<SessionSummary> {
  return prisma.$transaction(
    async (tx) => toSummary(await activeSession(tx, userId)),
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
  stepKey: string,
): Promise<SessionSummary> {
  return prisma.$transaction(async (tx) => {
    const session = await activeSession(tx, userId);
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
  stepKey: string,
): Promise<SessionSummary> {
  return prisma.$transaction(async (tx) => {
    const session = await activeSession(tx, userId);
    await tx.stepProgress.deleteMany({
      where: { sessionId: session.id, stepKey },
    });
    return reload(tx, session.id);
  }, SERIALIZABLE);
}

/**
 * Archives the active session, steps and all, and starts an empty one.
 * Nothing is deleted: the old session stays listed and recoverable (D33).
 */
export function startOver(userId: string): Promise<SessionSummary> {
  return prisma.$transaction(async (tx) => {
    await tx.learningSession.updateMany({
      where: { userId, status: "active" },
      data: { status: "archived", archivedAt: new Date() },
    });
    const created = await tx.learningSession.create({
      data: { userId },
      select: SUMMARY_SELECT,
    });
    return toSummary(created);
  }, SERIALIZABLE);
}

/** The student's earlier sessions, newest first. */
export async function listArchivedSessions(
  userId: string,
): Promise<ReadonlyArray<SessionSummary>> {
  const rows = await prisma.learningSession.findMany({
    where: { userId, status: "archived" },
    select: SUMMARY_SELECT,
    orderBy: [{ startedAt: "desc" }, { id: "desc" }],
  });
  return rows.map(toSummary);
}

/** The active session row, created when there is none. Inside a transaction. */
async function activeSession(tx: Tx, userId: string): Promise<SessionRow> {
  const active = await tx.learningSession.findFirst({
    where: { userId, status: "active" },
    select: SUMMARY_SELECT,
    orderBy: [{ startedAt: "desc" }, { id: "desc" }],
  });
  if (active !== null) {
    return active;
  }
  return tx.learningSession.create({
    data: { userId },
    select: SUMMARY_SELECT,
  });
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
    status: row.status,
    startedAt: row.startedAt,
    archivedAt: row.archivedAt,
    doneStepKeys: row.steps.map((step) => step.stepKey),
  };
}
