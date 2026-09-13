<!-- Hand-written for v2. Not generated from docs/intake.md; do not run /kickoff over it. -->

# 10: Multi-course foundations

**What to build:** Teacher can hold more than one course. Nothing a student sees changes except the home page, where the "Kubernetes — coming soon" entry becomes "Docker — coming soon". From the user's side this task delivers almost nothing; it exists so that Tasks 12 to 16 are content and checks rather than a second copy of the machinery.

**Blocked by:** none. v1 is done.

**Status:** built on `feature/multi-course-foundations`; pull request open, see below.

## Why this comes first

Every part of the app that counts progress assumes there is one course. `COURSE_SLUGS` in `src/lib/lesson-routes.ts` is a flat list of every lesson that exists; `courseProgress` in `src/lib/lesson-progress.ts` flattens all of them, so "finished" means both lessons and would come to mean all five; `LearningSession` is one-active-per-student, so starting over on Docker would archive a student's certificate progress with it; `TestAttempt` does not say which test was taken; `buildReport` gives each student one `stepsDone/stepsTotal` and one verdict.

Bolting a second course onto that is possible and costs more later than it saves now. D65 already anticipated this task: the catalog was written "preparing for a second course".

## Steps, a vertical slice in this order

1. **Back up the database** before anything else, per RUNBOOK 0.7. Two migrations land in v2 and this is the first.
2. Catalog: move lesson slugs off `COURSE_SLUGS` and onto the `Course` that owns them in `src/lib/courses.ts`. Add `courseFor(slug)` and `courseById(id)`. The catalog becomes the only place that knows which lessons make a course. Tests first.
3. Flip the coming-soon entry from `kubernetes` to `docker`, with a summary that opens on the hook: the student has already used Docker in the deploy lesson without being told what it was. Update `src/lib/courses.test.ts` and `e2e/home-courses.spec.ts`.
4. Progress: `courseProgress` takes the lessons of one course, not every lesson. `src/lib/lesson-progress.ts` is pure, so this is a test change and a signature change.
5. Schema: `courseId` on `LearningSession` and on `TestAttempt` in `prisma/schema.prisma`. Backfill both to `https-with-your-own-certificates`, then make them non-null in the same migration. `@@index([userId, status])` becomes `@@index([userId, courseId, status])`. Then `pnpm prisma migrate dev --name course-scoped-sessions`.
6. Data access: `startOrResume(userId, courseId)`, `markStepDone`, `markStepNotDone`, `startOver`, and `listArchivedSessions` all scope to one course in `src/lib/learning-session.ts`. Keep the serializable transaction and the one-active-session rule from D28; the rule is now one active session per student **per course**. Tests first.
7. Callers: the two lesson pages, `src/app/lessons/verify/`, `src/app/test/`, and `src/lib/admin-report.ts` pass the certificates course id. The admin report still shows one course; Task 16 makes it show both.
8. Record the decisions: the supersession of the Kubernetes half of D65, and the one-active-session-per-course rule as it now stands against D28.

## Acceptance criteria

- [x] The home page lists Docker as coming soon, links nowhere for it, and the certificates course still starts where it did. `e2e/home-courses.spec.ts` checks all three.
- [x] A student's certificate progress, certificate submission, and test attempt from before the migration are all still attached to them and still read the same. The migration adds a column and an index and touches nothing else; the backfill was run against a scratch database holding an archived session, an active session with a ticked step, an attempt with a session, and an attempt without one, and every row came through assigned to the certificates course.
- [x] Vitest covers the catalog (`courseFor`, `courseById`, one owner per slug), the scoped progress, and the scoped session functions, including a fresh start on one course leaving the other course's run alone. 206 tests pass.
- [x] All existing Playwright journeys pass unchanged, except the one home-page assertion that names the coming course. The suite has grown to 42 journeys since this task was written; all 42 pass, and `e2e/home-courses.spec.ts` is the only spec touched.
- [x] The migration is committed under `prisma/migrations/20260913033328_course_scoped_sessions/`. The development database was backed up first (`backup-2026-09-12.sql`, ignored by git); the production backup was taken before this branch was started.
- [ ] Every earlier test still passes locally. CI green on the pull request.
- [x] No new environment variable.

## Suggested skills

- `plan`: restate the blast radius before touching `learning-session.ts`; it is the most-depended-on module in the app.
- `tdd`: the catalog and the progress functions are pure. Write those tests first and they will carry the schema change.
- `backend-patterns`: the transaction boundaries are already right; do not loosen them while adding an argument.
- `verification-loop` and `test-coverage`: before the pull request.

## Notes

The migration is the risk. There is no staging environment (RUNBOOK 0.7), the production database has real student rows, and a non-null column added to a populated table fails unless the backfill runs first. Write the backfill into the migration by hand rather than trusting the generated SQL, and read it before running it.

`StepProgress` needs no course column. Its keys are unique per session and a session now belongs to one course, so a step key can never be counted against the wrong course. Leave it alone.

## Build notes

- The catalog exports `CERTIFICATES_COURSE` on its own, and every caller that
  today knows which course it is in (both lesson pages, verify, the test, the
  admin report) imports that. `courseFor(slug)` is used where the slug is the
  input, in `src/app/lessons/lesson-actions.ts`; Task 11's route will use it
  the same way. `courseById(id)` has no caller yet; Task 16 needs it to turn a
  stored id back into a course.
- `courseProgress` kept its signature. The scoping is in what the caller
  passes, and `loadCourseLessons(course)` in `src/lib/lesson.ts` is the one
  way to get it, replacing three copies of mapping slugs to `loadLesson`.
- The three private copies of "find or create the active session" in the
  session, submission, and attempt modules collapsed into `activeSessionId`
  (inside a transaction, creates) and `findActiveSessionId` (outside, reads
  only), both exported from `src/lib/learning-session.ts`.
- The deploy page loads the course's lessons once and picks its own out of
  them, instead of naming the first lesson's slug a second time.
- The migration was hand-written, not generated: `prisma migrate dev` refuses
  a required column on a populated table, and the backfill has to sit between
  adding the column and making it required. `prisma migrate diff` reports no
  drift between the applied database and the schema. Prisma applies a
  migration to PostgreSQL inside one transaction, so a failure part-way leaves
  the table as it was.
- The security review asked for `findAttempt` to be scoped by course as well
  as by student, so that once a second course records attempts the test
  result page cannot render another course's attempt against this course's
  topic titles. Done here rather than left for Task 16.
