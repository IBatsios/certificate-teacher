"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { Role } from "@/generated/prisma/enums";
import { isRole } from "@/lib/roles";
import { requireRole } from "@/lib/session";
import { changeUserRole } from "@/lib/users";
import {
  adminUsersPageWithMessage,
  type AdminUsersMessageKey,
} from "./messages";

const changeRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.custom<Role>(isRole),
});

/**
 * Gives a user the other role, subject to the rules in src/lib/role-change.ts,
 * applied inside one transaction by src/lib/users.ts. Only an admin can call
 * it. Redirects happen outside try/catch because `redirect` throws.
 */
export async function changeRole(formData: FormData): Promise<void> {
  const admin = await requireRole("admin");

  const parsed = changeRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    redirect(adminUsersPageWithMessage("invalid"));
  }

  const outcome = await tryChangeRole(
    admin.id,
    parsed.data.userId,
    parsed.data.role,
  );
  redirect(adminUsersPageWithMessage(outcome));
}

async function tryChangeRole(
  requesterId: string,
  userId: string,
  newRole: Role,
): Promise<AdminUsersMessageKey> {
  try {
    return await changeUserRole(requesterId, userId, newRole);
  } catch (error) {
    // Includes the write conflict Postgres raises when two admins change
    // roles at the same moment; "try again" is the right advice for both.
    console.error("Could not change the role", error);
    return "not-saved";
  }
}
