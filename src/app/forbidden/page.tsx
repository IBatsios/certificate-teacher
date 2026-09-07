import Link from "next/link";
import { auth } from "@/auth";
import type { Role } from "@/generated/prisma/enums";
import { HOME_BY_ROLE } from "@/lib/access";
import { currentUser, type CurrentUser } from "@/lib/session";
import { signOutAction } from "../sign-out-action";

/**
 * Where the proxy and `requireRole` send someone whose role does not fit the
 * page. Three cases: signed out, the wrong role, or a role that changed since
 * they signed in (the cookie still carries the old one; see D31).
 */
export default async function ForbiddenPage() {
  const [session, user] = await Promise.all([auth(), currentUser()]);
  if (user === null) {
    return <SignedOut />;
  }
  const cookieRole = session?.user.role;
  if (cookieRole !== undefined && cookieRole !== user.role) {
    return <RoleChanged role={user.role} />;
  }
  return <WrongRole user={user} />;
}

function SignedOut() {
  return (
    <main className="mx-auto w-full flex max-w-md flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">
        That page is not for your account
      </h1>
      <p>You are not signed in.</p>
      <Link href="/sign-in" className="underline">
        Sign in
      </Link>
    </main>
  );
}

function WrongRole({ user }: { user: CurrentUser }) {
  return (
    <main className="mx-auto w-full flex max-w-md flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">
        That page is not for your account
      </h1>
      <p>
        You are signed in as {user.email}, {describe(user.role)}, and that page
        belongs to the other role.
      </p>
      <Link href={HOME_BY_ROLE[user.role]} className="underline">
        Go to your page
      </Link>
    </main>
  );
}

function RoleChanged({ role }: { role: Role }) {
  return (
    <main className="mx-auto w-full flex max-w-md flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Your role has changed</h1>
      <p>
        You are now {describe(role)}. Sign out and sign in again, and the pages
        for that role will open.
      </p>
      <form action={signOutAction}>
        <button
          type="submit"
          className="rounded bg-accent px-4 py-2 text-on-accent"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}

function describe(role: Role): string {
  return role === "admin" ? "the admin" : "a student";
}
