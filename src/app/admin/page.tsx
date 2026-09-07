import Link from "next/link";
import { buildReport, type StudentReportRow } from "@/lib/admin-report";
import { requireRole } from "@/lib/session";

export default async function AdminReportPage() {
  await requireRole("admin");
  const rows = await buildReport();

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-8 py-10">
      <header className="flex flex-col gap-4">
        <p className="text-sm font-medium tracking-wide text-neutral-600 uppercase">
          Admin
        </p>
        <h1 className="text-3xl font-semibold text-balance text-neutral-900">
          Progress and results
        </h1>
        <p className="max-w-3xl text-neutral-800">
          Every student, and how far they have got in the run they are on now. A
          student who starts over begins an empty run, so their earlier work
          stops showing here; it is kept and never deleted.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <a
            href="/api/admin/export"
            className="min-h-11 rounded bg-black px-5 leading-11 font-medium text-white transition-[background-color] duration-150 ease-out hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          >
            Download as a spreadsheet
          </a>
          <Link href="/admin/users" className="underline underline-offset-2">
            Manage roles
          </Link>
        </div>
      </header>

      {rows.length === 0 ? (
        <p className="rounded border border-neutral-300 bg-neutral-50 p-4 text-neutral-800">
          Nobody has signed up yet.
        </p>
      ) : (
        <ReportTable rows={rows} />
      )}
    </main>
  );
}

function ReportTable({ rows }: { rows: ReadonlyArray<StudentReportRow> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">
          Every student, with lesson progress, certificate verdict, and latest
          test result
        </caption>
        <thead>
          <tr className="border-b border-neutral-300">
            <th scope="col" className="py-2 pr-4 font-semibold">
              Student
            </th>
            <th scope="col" className="py-2 pr-4 font-semibold">
              Lessons
            </th>
            <th scope="col" className="py-2 pr-4 font-semibold">
              Certificate
            </th>
            <th scope="col" className="py-2 pr-4 font-semibold">
              Test
            </th>
            <th scope="col" className="py-2 font-semibold">
              Focus areas
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.userId}
              className="border-b border-neutral-200 align-top"
            >
              <th scope="row" className="py-3 pr-4 font-normal break-all">
                {row.email}
              </th>
              <td className="py-3 pr-4 tabular-nums">
                {row.stepsDone} of {row.stepsTotal}
                {row.courseComplete && (
                  <span className="ml-2 text-emerald-700">done</span>
                )}
              </td>
              <td className="py-3 pr-4">
                <Verdict value={row.certificateVerdict} />
              </td>
              <td className="py-3 pr-4">
                {row.testPassed === null ? (
                  <NotYet />
                ) : (
                  <span
                    className={
                      row.testPassed ? "text-emerald-700" : "text-amber-700"
                    }
                  >
                    {row.testPassed ? "passed" : "not yet"}{" "}
                    <span className="text-neutral-600 tabular-nums">
                      ({row.testCorrect} of {row.testTotal})
                    </span>
                  </span>
                )}
              </td>
              <td className="py-3">
                {row.focusAreas.length === 0 ? (
                  <span className="text-neutral-400">—</span>
                ) : (
                  row.focusAreas.join(", ")
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Verdict({ value }: { value: "passed" | "failed" | null }) {
  if (value === null) {
    return <NotYet />;
  }
  return (
    <span
      className={value === "passed" ? "text-emerald-700" : "text-amber-700"}
    >
      {value === "passed" ? "passed" : "not yet"}
    </span>
  );
}

function NotYet() {
  return <span className="text-neutral-500">not submitted</span>;
}
