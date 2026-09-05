<!-- Generated from docs/intake.md by kickoff v0.1.0. Edit the intake, not this file. -->

# 06: The test phase with focus areas

**What to build:** "As a student, I can take a test phase and see a pass or fail with focus areas recorded, so that my knowledge is confirmed." From the user's side: the student opens the test, answers questions grouped by topic (certificate chains, https in the browser, the reverse proxy, the Java keystore), submits, and sees pass or fail; on a fail, the topics they missed are named as focus areas. The result is kept with their session. This replaces the one-question page from Task 01.

**Blocked by:** 01, 02, 04.

**Status:** ready

## Steps, a vertical slice in this order

1. Schema: extend `TestAttempt` with the `LearningSession` it belongs to, the score, and the focus areas, in `prisma/schema.prisma`, then `pnpm prisma migrate dev --name test-attempt`.
2. Data access: extend `src/lib/score.ts` from Task 01 to score per topic and return the focus areas, and `src/lib/test-attempt.ts` to record and list attempts; a Vitest test for each written first. Questions live in `content/test/questions.json`, not the database.
3. Interface: `src/app/api/test-attempts/route.ts` and `src/app/test/page.tsx`.
4. Walk the story as the student would. Add the end-to-end test at `e2e/test-phase.spec.ts`: a failing attempt names the missed topics; a passing attempt shows pass.
5. Update `README.md` or `CLAUDE.md` if a command changed.

## Acceptance criteria

- [ ] As a student, I can take the test and see a pass or fail with focus areas: demonstrated end to end.
- [ ] Vitest covers the scorer and the data-access functions as a caller would observe them, and passes.
- [ ] The end-to-end test passes.
- [ ] The migration is committed under `prisma/migrations/`.
- [ ] Every earlier test still passes; CI is green.
- [ ] Any new environment variable is in `.env.example` with a placeholder.

## Suggested skills

- `tdd`: the scorer first, with a table of answer sets and expected focus areas.
- `frontend-patterns` and `front-a11y`: a form a person with no technical experience can finish without help.
- `e2e-testing`: the pass and fail paths.

## Notes

The pass mark, and whether the test is locked until the lesson steps are done, are not specified in the intake. Choose, and record both in `docs/DECISIONS.md`.
