import Link from "next/link";
import { auth } from "@/auth";
import { HOME_BY_ROLE } from "@/lib/access";

export default async function Home() {
  const session = await auth();
  const user = session?.user;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-3xl font-semibold">Teacher</h1>
      <p>
        Learn how certificate chains work, get https in your browser, import a
        certificate into a Java keystore, and set up a reverse proxy. Then prove
        it with a test.
      </p>
      {user === undefined ? (
        <div className="flex gap-4">
          <Link
            href="/sign-in"
            className="rounded bg-black px-4 py-2 text-white"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded border border-black px-4 py-2"
          >
            Create an account
          </Link>
        </div>
      ) : (
        <Link
          href={HOME_BY_ROLE[user.role]}
          className="self-start rounded bg-black px-4 py-2 text-white"
        >
          {user.role === "admin" ? "See your students" : "Go to the lesson"}
        </Link>
      )}
    </main>
  );
}
