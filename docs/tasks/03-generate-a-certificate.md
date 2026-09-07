<!-- Generated from docs/intake.md by kickoff v0.1.0. Edit the intake, not this file. -->

# 03: Learn certificate chains and generate a certificate

**What to build:** The first half of "As a student, I can generate my own certificates, deploy them, and test using a reverse proxy and with Java", together with "As a student, I can save my session, come back to it later, or start over without losing the old one". From the user's side: a student opens the certificates lesson, reads short steps on what a chain is (root, intermediate, leaf, and who trusts whom), runs the commands to create their own root and a leaf certificate on their machine, and ticks each step done. Progress saves as they go; coming back later resumes where they left off; "start over" begins a fresh session and keeps the old one recoverable.

**Blocked by:** 01, 02.

**Status:** done. Merged to `main` through pull request #3 on 2026-09-06 with CI green.

## Steps, a vertical slice in this order

1. Schema: add `LearningSession` (belongs to `User`; started at; status active or archived) and `StepProgress` (belongs to `LearningSession`; step key; done at) in `prisma/schema.prisma`, then `pnpm prisma migrate dev --name learning-session`.
2. Data access: `src/lib/learning-session.ts` with `startOrResume`, `markStepDone`, `startOver` (archives the active session and starts a new one; never deletes), and a Vitest test for each written first.
3. Interface: `src/app/api/sessions/route.ts` and `src/app/api/sessions/steps/route.ts`, and `src/app/lessons/certificates/page.tsx`. Lesson text lives in `content/lessons/certificates/*.md` and is rendered, not stored in the database.
4. Walk the story as the student would. Add the end-to-end test at `e2e/generate-a-certificate.spec.ts`: sign in, tick a step, sign out and back in, the step is still ticked; start over, the old session is still listed.
5. Update `README.md` or `CLAUDE.md` if a command changed.

## Acceptance criteria

- [x] As a student, I can generate my own certificates and save my progress: demonstrated end to end. (Walked on 2026-09-06 with the commands run on OpenSSL 3.5; `e2e/generate-a-certificate.spec.ts`.)
- [x] Vitest covers the data-access functions as a caller would observe them, and passes. (`src/lib/learning-session.test.ts`, against the compose database; D36.)
- [x] The end-to-end test passes. (Tick, sign out and in, still ticked; start over lists the old session; a tick can be undone.)
- [x] Start over archives the old session; nothing is deleted. (D33; tested in Vitest and Playwright.)
- [x] The migration is committed under `prisma/migrations/`. (`20260906202507_learning_session`.)
- [x] Every earlier test still passes; CI is green. (46 unit and 11 browser tests; both CI jobs green on pull request #3.)
- [x] Any new environment variable is in `.env.example` with a placeholder. (None were needed.)

## Suggested skills

- `tdd`: the session functions, tests first.
- `frontend-design-direction` and `make-interfaces-feel-better`: the lesson layout is the app's main screen and its readers have no technical experience.
- `e2e-testing`: the first Playwright test.

## Notes

This is the first task that needs the database in CI. Add a service to the CI job: image `postgres:16`, environment `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` all set to `test`, port 5432, and `DATABASE_URL=postgresql://test:test@localhost:5432/test` in the job. Run `pnpm prisma migrate deploy` before the tests. This is also the first slice with an end-to-end test: add `pnpm playwright install --with-deps` before the test step.

The student's operating system is not specified in the intake (11.3 says desktop). Write the certificate commands for both PowerShell and a Unix shell, or decide and record it in `docs/DECISIONS.md`.
