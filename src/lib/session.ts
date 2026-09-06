import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "@/generated/prisma/enums";
import { FORBIDDEN_PATH, SIGN_IN_PATH } from "@/lib/access";
import { findUserById } from "@/lib/users";

export type CurrentUser = Readonly<{
  id: string;
  email: string;
  role: Role;
}>;

/**
 * The signed-in person, with their role as it is in the database right now,
 * or null when nobody is signed in. The session cookie carries a role too, but
 * that is a snapshot from sign-in; pages and actions rely on this one.
 */
export async function currentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (id === undefined) {
    return null;
  }
  const user = await findUserById(id);
  if (user === null) {
    return null;
  }
  return { id: user.id, email: user.email, role: user.role };
}

/**
 * For pages and server actions: the signed-in person holding `role`. Anyone
 * else is redirected, to sign-in when signed out and to the forbidden page
 * when signed in with the other role. Call it before touching data.
 */
export async function requireRole(role: Role): Promise<CurrentUser> {
  const user = await currentUser();
  if (user === null) {
    redirect(SIGN_IN_PATH);
  }
  if (user.role !== role) {
    redirect(FORBIDDEN_PATH);
  }
  return user;
}
