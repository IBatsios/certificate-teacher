import Link from "next/link";
import { sendSignInLink, signInWithPassword } from "./actions";
import { SIGN_IN_MESSAGES, isSignInMessageKey } from "./messages";

export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  const params = await searchParams;
  const message = messageFor(params.error);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-8 p-8">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      {message !== undefined && (
        <p
          role="alert"
          className="rounded border border-amber-400 bg-amber-50 p-3"
        >
          {message}
        </p>
      )}

      <form
        action={signInWithPassword}
        aria-labelledby="password-sign-in"
        className="flex flex-col gap-4"
      >
        <h2 id="password-sign-in" className="font-medium">
          With your password
        </h2>
        <label className="flex flex-col gap-1">
          <span>Email</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="rounded border border-neutral-400 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span>Password</span>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="rounded border border-neutral-400 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="self-start rounded bg-black px-4 py-2 text-white"
        >
          Sign in
        </button>
      </form>

      <form
        action={sendSignInLink}
        aria-labelledby="link-sign-in"
        className="flex flex-col gap-4"
      >
        <h2 id="link-sign-in" className="font-medium">
          Or with a link sent to your email
        </h2>
        <p className="text-sm text-neutral-600">
          No password needed. We email you a link; opening it signs you in. If
          this is your first time, it also creates your account.
        </p>
        <label className="flex flex-col gap-1">
          <span>Email</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="rounded border border-neutral-400 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="self-start rounded border border-black px-4 py-2"
        >
          Email me a sign-in link
        </button>
      </form>

      <p>
        New here and want a password?{" "}
        <Link href="/sign-up" className="underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}

function messageFor(value: string | string[] | undefined): string | undefined {
  const key = Array.isArray(value) ? value[0] : value;
  if (key === undefined) {
    return undefined;
  }
  return isSignInMessageKey(key)
    ? SIGN_IN_MESSAGES[key]
    : SIGN_IN_MESSAGES.Default;
}
