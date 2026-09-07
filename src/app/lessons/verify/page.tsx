import Link from "next/link";
import {
  CERTIFICATE_CHECKS,
  type CertificateCheckKey,
} from "@/lib/certificate";
import {
  listSubmissions,
  type SubmissionSummary,
} from "@/lib/certificate-submission";
import { lessonPath } from "@/lib/lesson-routes";
import { requireRole } from "@/lib/session";
import { checkSubmission } from "./actions";
import { verifyMessageFor } from "./messages";

export default async function VerifyPage({
  searchParams,
}: PageProps<"/lessons/verify">) {
  const student = await requireRole("student");
  const params = await searchParams;
  const submissions = await listSubmissions(student.id);
  const message = verifyMessageFor(params.message);
  const latest = submissions[0];

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-8 py-10">
      <header className="flex flex-col gap-4">
        <p className="text-sm font-medium tracking-wide text-neutral-600 uppercase">
          Check your work
        </p>
        <h1 className="text-3xl font-semibold text-balance text-neutral-900">
          Have your certificate checked
        </h1>
        <p className="text-neutral-800">
          Send the two certificates you made in{" "}
          <Link
            href={lessonPath("certificates")}
            className="underline underline-offset-2"
          >
            the first lesson
          </Link>{" "}
          and this page will tell you what it finds. Nothing here changes your
          certificates; it only reads them.
        </p>
        <p className="rounded border border-neutral-300 bg-neutral-50 p-3 text-sm text-neutral-800">
          <strong className="font-semibold">
            Send the .crt files only, never a .key file.
          </strong>{" "}
          A private key is the one part of this that must stay on your computer.
          Anything holding one is refused unread and nothing is kept.
        </p>
      </header>

      {message !== undefined && (
        <p
          role="alert"
          className="rounded border border-amber-400 bg-amber-50 p-3"
        >
          {message}
        </p>
      )}

      <SubmitForm />
      {latest !== undefined && <Result submission={latest} />}
      <WhatIsChecked />
      {submissions.length > 1 && <Earlier submissions={submissions.slice(1)} />}
    </main>
  );
}

function SubmitForm() {
  return (
    <form
      action={checkSubmission}
      className="flex flex-col gap-6 rounded-lg border border-neutral-300 p-5"
      aria-labelledby="submit-title"
    >
      <h2 id="submit-title" className="text-lg font-semibold">
        Your two certificates
      </h2>

      <Field
        fileName="rootFile"
        textName="rootText"
        label="Your root certificate"
        hint="The file called my-root.crt."
      />
      <Field
        fileName="leafFile"
        textName="leafText"
        label="The certificate your root signed"
        hint="The file called localhost.crt."
      />

      <button
        type="submit"
        className="min-h-11 self-start rounded bg-black px-5 font-medium text-white transition-[background-color,transform] duration-150 ease-out hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black active:scale-[0.97]"
      >
        Check them
      </button>
    </form>
  );
}

function Field({
  fileName,
  textName,
  label,
  hint,
}: {
  fileName: string;
  textName: string;
  label: string;
  hint: string;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-medium">{label}</legend>
      <p className="text-sm text-neutral-700">{hint}</p>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-neutral-700">Choose the file</span>
        <input
          type="file"
          name={fileName}
          accept=".crt,.pem,.cer,application/x-x509-ca-cert,text/plain"
          className="rounded border border-neutral-300 p-2"
        />
      </label>
      <details className="text-sm">
        <summary className="cursor-pointer text-neutral-700 underline underline-offset-2">
          Or paste it instead
        </summary>
        <label className="mt-2 flex flex-col gap-1">
          <span className="text-neutral-700">
            Open the file in a text editor and paste everything, including the
            BEGIN and END lines.
          </span>
          <textarea
            name={textName}
            rows={6}
            spellCheck={false}
            className="rounded border border-neutral-300 p-2 font-mono text-xs"
          />
        </label>
      </details>
    </fieldset>
  );
}

function Result({ submission }: { submission: SubmissionSummary }) {
  const failed = new Set<CertificateCheckKey>(submission.failedChecks);
  const passed = submission.verdict === "passed";
  return (
    <section
      aria-labelledby="result-title"
      className={`rounded-lg border p-5 ${
        passed
          ? "border-emerald-300 bg-emerald-50"
          : "border-amber-400 bg-amber-50"
      }`}
    >
      <h2
        id="result-title"
        className={`text-lg font-semibold ${passed ? "text-emerald-900" : "text-amber-900"}`}
      >
        {passed
          ? "Your certificate is what the lesson asked for"
          : "Not quite yet"}
      </h2>

      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="font-medium">Subject</dt>
        <dd className="font-mono text-xs break-all">{submission.subject}</dd>
        <dt className="font-medium">Issuer</dt>
        <dd className="font-mono text-xs break-all">{submission.issuer}</dd>
        <dt className="font-medium">Valid from</dt>
        <dd className="tabular-nums">{formatDate(submission.notBefore)}</dd>
        <dt className="font-medium">Valid until</dt>
        <dd className="tabular-nums">{formatDate(submission.notAfter)}</dd>
      </dl>

      <ul className="mt-4 flex flex-col gap-2">
        {CERTIFICATE_CHECKS.map((check) => {
          const didFail = failed.has(check.key);
          return (
            <li key={check.key} className="flex flex-col gap-1">
              <span className="flex items-start gap-2">
                <span aria-hidden="true">{didFail ? "✗" : "✓"}</span>
                <span>
                  {check.title}
                  <span className="sr-only">
                    {didFail ? ": not met" : ": met"}
                  </span>
                </span>
              </span>
              {didFail && (
                <span className="ml-6 text-sm text-neutral-800">
                  {check.whenFailed}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function WhatIsChecked() {
  return (
    <section
      aria-labelledby="what-title"
      className="flex flex-col gap-3 border-t border-neutral-200 pt-8"
    >
      <h2 id="what-title" className="text-lg font-semibold">
        What is checked
      </h2>
      <p className="text-neutral-700">
        Every certificate is judged against the same list, so nothing here is a
        matter of opinion.
      </p>
      <ol className="flex list-decimal flex-col gap-1 pl-5 text-neutral-800">
        {CERTIFICATE_CHECKS.map((check) => (
          <li key={check.key}>{check.title}</li>
        ))}
      </ol>
      <p className="text-sm text-neutral-700">
        The one worth understanding is the signature. A certificate can name any
        issuer it likes; only the signature proves that issuer really made it.
      </p>
    </section>
  );
}

function Earlier({
  submissions,
}: {
  submissions: ReadonlyArray<SubmissionSummary>;
}) {
  return (
    <section
      aria-labelledby="earlier-checks-title"
      className="flex flex-col gap-3 border-t border-neutral-200 pt-8"
    >
      <h2 id="earlier-checks-title" className="text-lg font-semibold">
        Earlier checks
      </h2>
      <ul className="flex flex-col gap-2 text-sm text-neutral-700">
        {submissions.map((submission) => (
          <li key={submission.id} className="tabular-nums">
            {formatDate(submission.createdAt)}:{" "}
            {submission.verdict === "passed"
              ? "passed"
              : `${submission.failedChecks.length} check${
                  submission.failedChecks.length === 1 ? "" : "s"
                } not met`}
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
