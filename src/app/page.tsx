import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-3xl font-semibold">Teacher</h1>
      <p>
        Learn how certificate chains work, get https in your browser, import a
        certificate into a Java keystore, and set up a reverse proxy. Then prove
        it with a test.
      </p>
      <Link
        href="/test"
        className="self-start rounded bg-black px-4 py-2 text-white"
      >
        Take the test
      </Link>
    </main>
  );
}
