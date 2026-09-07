import Link from "next/link";
import { auth } from "@/auth";
import { HOME_BY_ROLE } from "@/lib/access";
import { signOutAction } from "./sign-out-action";
import { ThemeToggle } from "./theme-toggle";

/**
 * The strip at the top of every page: who is signed in and a way out. It
 * reads the session cookie only; what it shows is not used for authorization.
 */
export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="border-b border-line-soft">
      <nav
        aria-label="Account"
        className="mx-auto w-full flex max-w-2xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-8 py-3 text-sm"
      >
        <Link href="/" className="font-semibold">
          Teacher
        </Link>
        <div className="flex items-center gap-4">
          {user === undefined ? (
            <Link href="/sign-in" className="underline">
              Sign in
            </Link>
          ) : (
            <>
              <Link href={HOME_BY_ROLE[user.role]} className="underline">
                {user.email}
              </Link>
              <form action={signOutAction}>
                <button type="submit" className="underline">
                  Sign out
                </button>
              </form>
            </>
          )}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
