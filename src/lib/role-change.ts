import type { Role } from "@/generated/prisma/enums";

export type RoleChangeRequest = Readonly<{
  /** The admin asking for the change. */
  requesterId: string;
  /** The person to change, or null when no such person exists. */
  target: Readonly<{ id: string; role: Role }> | null;
  newRole: Role;
  /** How many admins exist right now, the target included. */
  adminCount: number;
}>;

export type RoleChangeRefusal =
  "not-found" | "unchanged" | "own-role" | "last-admin";

export type RoleChangeDecision =
  | Readonly<{ kind: "change" }>
  | Readonly<{ kind: "refuse"; reason: RoleChangeRefusal }>;

/**
 * Whether an admin may give someone a role. Two rules keep the app
 * manageable: nobody changes their own role, and the last admin cannot be
 * demoted. Pure; the users page action reads the counts and applies it.
 */
export function decideRoleChange(
  request: RoleChangeRequest,
): RoleChangeDecision {
  const { requesterId, target, newRole, adminCount } = request;
  if (target === null) {
    return { kind: "refuse", reason: "not-found" };
  }
  if (target.role === newRole) {
    return { kind: "refuse", reason: "unchanged" };
  }
  if (target.id === requesterId) {
    return { kind: "refuse", reason: "own-role" };
  }
  if (target.role === "admin" && adminCount <= 1) {
    return { kind: "refuse", reason: "last-admin" };
  }
  return { kind: "change" };
}
