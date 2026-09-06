import { Role } from "@/generated/prisma/enums";

/**
 * The role a person gets when they sign up. The one admin is named by the
 * ADMIN_EMAIL environment variable; everyone else starts as a student. Roles
 * can be changed afterwards on /admin/users.
 */
export function roleForNewUser(
  email: string,
  adminEmail: string | undefined,
): Role {
  if (adminEmail === undefined) {
    return "student";
  }
  return normalizeEmail(email) === normalizeEmail(adminEmail)
    ? "admin"
    : "student";
}

/** The form an email is stored and compared in. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const ROLES: ReadonlySet<unknown> = new Set(Object.values(Role));

/** True when `value` is one of the roles, exactly as stored. */
export function isRole(value: unknown): value is Role {
  return ROLES.has(value);
}
