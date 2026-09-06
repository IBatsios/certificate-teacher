import Link from "next/link";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";
import { signUpWithPassword } from "./actions";
import { SIGN_UP_MESSAGES, isSignUpMessageKey } from "./messages";

export default async function SignUpPage({
  searchParams,
}: PageProps<"/sign-up">) {
  const params = await searchParams;
  const message = messageFor(params.error);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-8 p-8">
      <h1 className="text-2xl font-semibold">Create an account</h1>
      <p>
        Choose a password to sign in with. If you would rather not have one, go
        to{" "}
        <Link href="/sign-in" className="underline">
          sign in
        </Link>{" "}
        and ask for a link by email instead; that creates your account too.
      </p>
      {message !== undefined && (
        <p
          role="alert"
          className="rounded border border-amber-400 bg-amber-50 p-3"
        >
          {message}
        </p>
      )}

      <form action={signUpWithPassword} className="flex flex-col gap-4">
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
          <span>Password, at least {MIN_PASSWORD_LENGTH} characters</span>
          <input
            type="password"
            name="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            className="rounded border border-neutral-400 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="self-start rounded bg-black px-4 py-2 text-white"
        >
          Create my account
        </button>
      </form>

      <p>
        Already have one?{" "}
        <Link href="/sign-in" className="underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}

function messageFor(value: string | string[] | undefined): string | undefined {
  const key = Array.isArray(value) ? value[0] : value;
  return key !== undefined && isSignUpMessageKey(key)
    ? SIGN_UP_MESSAGES[key]
    : undefined;
}
