<!-- Generated from docs/intake.md by kickoff v0.1.0. Edit the intake, not this file. -->

# 06: The test phase with focus areas

**What to build:** "As a student, I can take a test phase and see a pass or fail with focus areas recorded, so that my knowledge is confirmed." From the user's side: the student opens the test, answers questions grouped by topic (certificate chains, https in the browser, the reverse proxy, the Java keystore), submits, and sees pass or fail; on a fail, the topics they missed are named as focus areas. The result is kept with their session. This replaces the one-question page from Task 01.

**Blocked by:** 01, 02, 04.

**Status:** built on `feature/test-phase` on 2026-09-07. Unit tests (130) and Playwright (28) green locally; pull request and CI pending.

## Steps, a vertical slice in this order

1. Schema: extend `TestAttempt` with the `LearningSession` it belongs to, the score, and the focus areas, in `prisma/schema.prisma`, then `pnpm prisma migrate dev --name test-attempt`.
2. Data access: extend `src/lib/score.ts` from Task 01 to score per topic and return the focus areas, and `src/lib/test-attempt.ts` to record and list attempts; a Vitest test for each written first. Questions live in `content/test/questions.json`, not the database.
3. Interface: `src/app/api/test-attempts/route.ts` and `src/app/test/page.tsx`.
4. Walk the story as the student would. Add the end-to-end test at `e2e/test-phase.spec.ts`: a failing attempt names the missed topics; a passing attempt shows pass.
5. Update `README.md` or `CLAUDE.md` if a command changed.

## Acceptance criteria

- [x] As a student, I can take the test and see a pass or fail with focus areas: demonstrated end to end, for a pass, one missed topic, and two.
- [x] Vitest covers the scorer and the data-access functions as a caller would observe them, and passes. 30 new tests, including the question bank loader.
- [x] The end-to-end test passes: `e2e/test-phase.spec.ts`, six journeys.
- [x] The migration is committed under `prisma/migrations/`: `20260907170558_test_attempt`. The database was backed up first.
- [x] Every earlier test still passes locally. CI is green: pending the pull request.
- [x] Any new environment variable is in `.env.example` with a placeholder. None was added.

## Suggested skills

- `tdd`: the scorer first, with a table of answer sets and expected focus areas.
- `frontend-patterns` and `front-a11y`: a form a person with no technical experience can finish without help.
- `e2e-testing`: the pass and fail paths.

## Notes

The pass mark, and whether the test is locked until the lesson steps are done, are not specified in the intake. Choose, and record both in `docs/DECISIONS.md`.

## Notes from building it

The two decisions the task left open are D58 (the pass mark) and D59 (no lock).
D60 covers the question bank being a validated JSON file.

The migration needed care. `TestAttempt` already exists and production may hold
rows, so a required `sessionId` would have failed there. It is nullable, and
`correct` and `total` are defaulted, so the migration is safe on a table that
already has data. Attempts made before this task genuinely belong to no
session, and saying so is more honest than inventing one.

The interface stayed a server action rather than the
`src/app/api/test-attempts/route.ts` the task names, for the reasons in D32 and
D56. The page was already an action, so this is no change rather than a
deviation.

Not verified: the questions themselves. Sixteen questions across four topics
are written and every one is answerable from the lessons, but whether the
distractors are fair, and whether a real student reads them the way they were
meant, is a judgement no test makes.
