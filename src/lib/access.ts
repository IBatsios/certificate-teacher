import type { Role } from "@/generated/prisma/enums";

export type AccessDecision =
  | Readonly<{ kind: "allow" }>
  | Readonly<{ kind: "redirect"; to: string }>
  | Readonly<{ kind: "forbid" }>;

export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";
export const FORBIDDEN_PATH = "/forbidden";

/** Where each role lands after signing in. */
export const HOME_BY_ROLE: Readonly<Record<Role, string>> = {
  student: "/test",
  admin: "/admin/users",
};

// Pages anyone can open, signed in or not.
const PUBLIC_PATHS: ReadonlySet<string> = new Set([
  "/",
  SIGN_IN_PATH,
  SIGN_UP_PATH,
  "/check-your-email",
  FORBIDDEN_PATH,
]);

// Pages that only make sense before signing in. A signed-in person who opens
// one is sent home instead.
const SIGNED_OUT_ONLY_PATHS: ReadonlySet<string> = new Set([
  SIGN_IN_PATH,
  SIGN_UP_PATH,
]);

// The role matrix from docs/PRD.md: each area of the app belongs to one role.
// A path that starts with the prefix (as a whole segment) is in the area.
const ROLE_AREAS: ReadonlyArray<Readonly<{ prefix: string; role: Role }>> = [
  { prefix: "/test", role: "student" },
  { prefix: "/admin", role: "admin" },
];

/**
 * Decides what happens when someone asks for a path. `role` is null when they
 * are not signed in. Pure: the proxy and the pages both call it.
 *
 * Paths in no role's area still need a sign-in; once signed in, anyone can
 * open them (that is where a not-found page ends up).
 */
export function decideAccess(
  pathname: string,
  role: Role | null,
): AccessDecision {
  if (role !== null && SIGNED_OUT_ONLY_PATHS.has(pathname)) {
    return { kind: "redirect", to: HOME_BY_ROLE[role] };
  }
  if (PUBLIC_PATHS.has(pathname)) {
    return { kind: "allow" };
  }
  if (role === null) {
    return { kind: "redirect", to: SIGN_IN_PATH };
  }

  const area = ROLE_AREAS.find((candidate) =>
    isInArea(pathname, candidate.prefix),
  );
  if (area !== undefined && area.role !== role) {
    return { kind: "forbid" };
  }
  return { kind: "allow" };
}

function isInArea(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}
