import { Prisma } from "@/generated/prisma/client";
import type { Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { decideRoleChange, type RoleChangeRefusal } from "@/lib/role-change";

export type UserRecord = Readonly<{
  id: string;
  email: string;
  role: Role;
  passwordHash: string | null;
}>;

export type UserSummary = Readonly<{
  id: string;
  email: string;
  role: Role;
  createdAt: Date;
}>;

const USER_RECORD_FIELDS = {
  id: true,
  email: true,
  role: true,
  passwordHash: true,
} as const;

/** `email` must already be normalized (see src/lib/roles.ts). */
export function findUserByEmail(email: string): Promise<UserRecord | null> {
  return prisma.user.findUnique({
    where: { email },
    select: USER_RECORD_FIELDS,
  });
}

export function findUserById(id: string): Promise<UserRecord | null> {
  return prisma.user.findUnique({ where: { id }, select: USER_RECORD_FIELDS });
}

export function createUserWithPassword(
  data: Readonly<{ email: string; passwordHash: string; role: Role }>,
): Promise<UserRecord> {
  return prisma.user.create({ data, select: USER_RECORD_FIELDS });
}

/** Everyone who has signed up, newest first. */
export function listUsers(): Promise<ReadonlyArray<UserSummary>> {
  return prisma.user.findMany({
    select: { id: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

export type RoleChangeOutcome = "changed" | RoleChangeRefusal;

/**
 * Gives `userId` the role `newRole` on behalf of `requesterId`, subject to the
 * rules in src/lib/role-change.ts. The read, the decision, and the write run
 * in one serializable transaction: two admins demoting each other at the same
 * moment cannot both get through, because Postgres aborts one of them with a
 * write conflict, which the caller sees as a thrown error.
 */
export function changeUserRole(
  requesterId: string,
  userId: string,
  newRole: Role,
): Promise<RoleChangeOutcome> {
  return prisma.$transaction(
    async (tx) => {
      const [target, adminCount] = await Promise.all([
        tx.user.findUnique({
          where: { id: userId },
          select: { id: true, role: true },
        }),
        tx.user.count({ where: { role: "admin" } }),
      ]);
      const decision = decideRoleChange({
        requesterId,
        target,
        newRole,
        adminCount,
      });
      if (decision.kind === "refuse") {
        return decision.reason;
      }
      await tx.user.update({ where: { id: userId }, data: { role: newRole } });
      return "changed";
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
