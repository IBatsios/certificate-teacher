<!-- Hand-written for v2. Not generated from docs/intake.md; do not run /kickoff over it. -->

# 16: The Docker test phase, and the report across both courses

**What to build:** "As a student, I can take the Docker test and see a pass or fail with focus areas" and "as the admin, I can see where each student is in each course." The last task of v2. From the user's side: the Docker course ends in a test of its own, and the admin page and its export show both courses instead of one.

**Blocked by:** 12, 13, 14, 15.

**Status:** not started.

## Steps, a vertical slice in this order

1. Questions: `content/lessons/../test/` is currently one file at `content/test/questions.json`. Move to one bank per course, keyed by course id, and load the bank the course names. 16 questions over 4 topics — images, building, running, networking — matching the existing shape so that `TOPIC_PASS_RATIO` and `passMarkFor` (D58) carry over untouched.
2. `src/lib/score.ts` changes not at all. If it needs to change, something upstream is wrong.
3. Interface: the test page takes the course, as the lesson route does after Task 11.
4. Report: `buildReport` returns one row per student **per course**. `StudentReportRow` gains the course, and the certificate verdict and image verdict become one nullable "submission verdict" per course, or two columns; decide when the data is in front of you and record it.
5. Export: `src/app/api/admin/export/route.ts` follows, with the course as a column. The header row changes, so anyone with a saved spreadsheet is affected; note it in the handoff.
6. Land the open item from the v1 handoff: signing in as the admin should land on the report, not `/admin/users`. One line in `HOME_BY_ROLE` in `src/lib/access.ts`, and two test updates.
7. End-to-end tests: `e2e/docker-test-phase.spec.ts`, and an update to the admin journeys.

## Acceptance criteria

- [ ] As a student, I can take the Docker test and see a pass or fail with named focus areas, for a pass, one missed topic, and two.
- [ ] Passing the Docker test does not change the certificates course result, and the reverse. An attempt is recorded against the course it was taken in.
- [ ] `src/lib/score.ts` is unchanged by this task.
- [ ] As the admin, I can see both courses per student, and the export carries the course.
- [ ] Signing in as the admin lands on the report.
- [ ] The sixteen questions are answerable from the Docker lessons alone, the correct answer is not always in the same position (D61), and the wrong answers are plausible rather than silly.
- [ ] Vitest covers the per-course bank loading and the report as a caller would observe it, and passes.
- [ ] The end-to-end tests pass.
- [ ] Every earlier test still passes locally. CI green on the pull request.

## Suggested skills

- `tdd`: the bank loader and the report first.
- `test-coverage`, `code-review`, `security-scan`, `verification-loop`: before the pull request. The export hands out every student's email address.
- `handoff`: this is the end of the phase; write `docs/handoff-items/handoff-after-docker.md`.

## Notes

No migration. Task 10 put `courseId` on `TestAttempt` and Task 15 added `ImageSubmission`; this task is reads and content.

The v1 handoff's fourth open item — that nobody but the author has judged whether the sixteen certificate questions read fairly for someone with no technical experience — applies to these sixteen before they are written, not after. Have somebody who is not the author read them.

`sign-in-limits.ts` is still the untested one with the `a && b` shape that Task 05 found to be a real bug in `certificate-limits.ts`. It is not this task's job, but it is the last thing on the v1 list that is not folded into v2 anywhere. Either do it here or write it forward into the next handoff deliberately.
