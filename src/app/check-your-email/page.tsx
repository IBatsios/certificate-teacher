import Link from "next/link";

export default function CheckYourEmailPage() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Check your email</h1>
      <p>
        We sent a sign-in link to the address you entered. Open the email and
        click the link; that signs you in here.
      </p>
      <p className="text-sm text-neutral-600">
        The link works once and stops working after a day. If it does not arrive
        in a few minutes, check your spam folder, then{" "}
        <Link href="/sign-in" className="underline">
          ask for another
        </Link>
        .
      </p>
    </main>
  );
}
