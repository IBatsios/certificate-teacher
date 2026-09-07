<!-- Generated from docs/intake.md by kickoff v0.1.0. Edit the intake, not this file. -->

# 07: Admin view of progress and results, with export

**What to build:** "As an admin, I can view results and progress per student and export results with focus areas, so that I know where staff need guidance." From the user's side: the admin opens one page listing every student with their active session's progress (which lesson steps are done), their certificate verdict, and their latest test result with focus areas; one button downloads the same as a file.

**Blocked by:** 01, 02, 05, 06.

**Status:** built on `feature/admin-report` on 2026-09-07. Unit tests (151) and Playwright (35) green locally; pull request and CI pending.

## Steps, a vertical slice in this order

1. Schema: no new entity expected; this reads what Tasks 03 to 06 wrote. If a summary needs an index, add it and run `pnpm prisma migrate dev --name admin-report`.
2. Data access: `src/lib/admin-report.ts` with a function that assembles one row per student and a pure function that serializes rows to the export file, with a Vitest test for each written first.
3. Interface: `src/app/admin/page.tsx` and `src/app/api/admin/export/route.ts`, both admin-only through the guard from Task 02.
4. Walk the story as the admin would. Add the end-to-end test at `e2e/admin-report.spec.ts`: a student is not allowed in; the admin sees the row and downloads the file.
5. Update `README.md` or `CLAUDE.md` if a command changed.

## Acceptance criteria

- [x] As an admin, I can view progress and results per student and export them with focus areas: demonstrated end to end, including the download.
- [x] Vitest covers the report and serializer functions as a caller would observe them, and passes. 16 new tests.
- [x] The end-to-end test passes: `e2e/admin-report.spec.ts`, six journeys.
- [x] A student cannot reach the admin page or the export route. The route calls `requireRole` itself rather than trusting the proxy, and the test asks for it directly as well as through the browser (D64).
- [x] Any migration is committed under `prisma/migrations/`. None was needed: this reads what Tasks 03 to 06 already write, and the indexes those tasks added cover it.
- [x] Every earlier test still passes locally. CI is green: pending the pull request.
- [x] Any new environment variable is in `.env.example` with a placeholder. None was added.

## Suggested skills

- `api-design`: the export route, its content type, and its file name.
- `tdd`: the serializer first.

## Notes

The export format is not specified in the intake (7.2 says "export results with focus areas"). CSV is the plain choice; record it in `docs/DECISIONS.md`.

## Notes from building it

CSV injection is real here rather than theoretical. A student picks their own
email address, and `z.string().email()` accepts `+49@example.com` and
`-2+3@example.com`; a spreadsheet treats a cell beginning with `+` or `-` as a
formula. The export prefixes any such field with an apostrophe, and an
end-to-end test signs up with one of those addresses and checks the file
(D63).

The N+1 risk was measured, not assumed. Postgres was put in `log_statement=all`
and the statements counted: `buildReport` runs five, one per table, for six
students. The comment in the file says five rather than "one query", because
five is what it does.

The export is a route handler rather than a server action, which is a
departure from Tasks 05 and 06 but the right one: a download needs
`Content-Disposition`, which an action cannot set (D64).

One question left open rather than decided: after signing in, an admin still
lands on `/admin/users` rather than the new report, although the intake
describes the admin as the person who views results and progress. Changing
`HOME_BY_ROLE` is a behaviour change this task did not ask for.
