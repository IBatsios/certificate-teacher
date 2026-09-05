<!-- Generated from docs/intake.md by kickoff v0.1.0. Edit the intake, not this file. -->

# 07: Admin view of progress and results, with export

**What to build:** "As an admin, I can view results and progress per student and export results with focus areas, so that I know where staff need guidance." From the user's side: the admin opens one page listing every student with their active session's progress (which lesson steps are done), their certificate verdict, and their latest test result with focus areas; one button downloads the same as a file.

**Blocked by:** 01, 02, 05, 06.

**Status:** ready

## Steps, a vertical slice in this order

1. Schema: no new entity expected; this reads what Tasks 03 to 06 wrote. If a summary needs an index, add it and run `pnpm prisma migrate dev --name admin-report`.
2. Data access: `src/lib/admin-report.ts` with a function that assembles one row per student and a pure function that serializes rows to the export file, with a Vitest test for each written first.
3. Interface: `src/app/admin/page.tsx` and `src/app/api/admin/export/route.ts`, both admin-only through the guard from Task 02.
4. Walk the story as the admin would. Add the end-to-end test at `e2e/admin-report.spec.ts`: a student is not allowed in; the admin sees the row and downloads the file.
5. Update `README.md` or `CLAUDE.md` if a command changed.

## Acceptance criteria

- [ ] As an admin, I can view progress and results per student and export them with focus areas: demonstrated end to end.
- [ ] Vitest covers the report and serializer functions as a caller would observe them, and passes.
- [ ] The end-to-end test passes.
- [ ] A student cannot reach the admin page or the export route.
- [ ] Any migration is committed under `prisma/migrations/`.
- [ ] Every earlier test still passes; CI is green.
- [ ] Any new environment variable is in `.env.example` with a placeholder.

## Suggested skills

- `api-design`: the export route, its content type, and its file name.
- `tdd`: the serializer first.

## Notes

The export format is not specified in the intake (7.2 says "export results with focus areas"). CSV is the plain choice; record it in `docs/DECISIONS.md`.
