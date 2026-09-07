<!-- Generated from docs/intake.md by kickoff v0.1.0. Edit the intake, not this file. -->

# 09: Definition of done for v1

**What to build:** Nothing new. Verify that v1 is what the intake said it would be.

**Blocked by:** every other task.

**Status:** done. Verified on 2026-09-07 against `main` at 9fd1c7b, which is the commit production is running.

## Acceptance criteria

- [x] A new user can sign up with email and password or a magic link, and sign back in. `e2e/password-sign-in.spec.ts` signs up, signs out, and signs back in; `e2e/magic-link.spec.ts` does the same by link and proves a link works only once.
- [x] A student can work through the certificate-chain lesson, generate a certificate, deploy it, and verify it with a reverse proxy and a Java keystore, with progress saved between visits. `e2e/generate-a-certificate.spec.ts` ticks a step, signs out, and finds it still ticked; `e2e/deploy-the-certificate.spec.ts` walks the second lesson. Every command in both lessons was run while writing them, on Windows with OpenSSL 3.5.7 and JDK 25 (see Task 04, and the correction there about PowerShell).
- [x] A student can upload their certificate and the app checks it. `e2e/verify-a-certificate.spec.ts`, five journeys, including a private key being refused and nothing kept.
- [x] A student can take the test phase, and a pass or fail with focus areas is recorded. `e2e/test-phase.spec.ts`, seven journeys: a pass, one missed topic named, two missed topics named, and the choice order changing on every render (D61).
- [x] A student can start over without losing the option to recover the old session. Covered in `e2e/generate-a-certificate.spec.ts`, and by unit tests on `learning-session`, `certificate-submission`, and `test-attempt` that each check the old run is still in the database after starting over (D33).
- [x] The admin can see every student's progress and results and export them. `e2e/admin-report.spec.ts`, six journeys, including a student being refused both the page and the route, and a formula-shaped email address being defused in the file (D63).
- [x] It is live over HTTPS, at `teacher.ioannisbatsios.com` rather than the apex: the apex serves the personal website, which D40 records and the intake now says. Checked on 2026-09-07: 200, HSTS `max-age=31536000`, certificate issued by Google Trust Services through Cloudflare. Production is running 9fd1c7b, the merge of pull request #16.
- [x] Every task from 01 to 08 has all of its acceptance criteria checked: counted, zero unchecked boxes across the eight files. The status lines on 02 to 07 still said a pull request was open or pending, and were corrected here to name the pull request that merged each one.
- [x] `README.md` explains how to run, test, and deploy: it has Run it, Test, and Deploy sections, and names `pnpm dev`, `pnpm test`, Playwright, `docker compose`, and the migration procedure.
- [x] `docs/DECISIONS.md` records every decision made during the build that the intake did not: D1 to D64, no gaps in the numbering. D51 to D64 were added by Tasks 04 to 07.
- [x] A handoff doc in `docs/handoff-items/` says what v2 should start with: `handoff-after-v1.md`.

**Success signal, one month after launch:** At least one staff member has passed the test, and the admin view shows where people got stuck.

## What was checked, and how

Nothing was taken on trust from an earlier task's own notes.

- The suites were run against `main`: 151 unit tests in 18 files, 35 Playwright
  journeys in 9 files, a clean type check, and a production build.
- The live site was checked over the network, not inferred from the deploy
  succeeding: 200, HSTS, and the certificate's issuer.
- The commit production is running was read from Railway and compared with
  `main`: both 9fd1c7b.
- The acceptance boxes in Tasks 01 to 08 were counted rather than skimmed.
- The decision numbering was checked for gaps.

## What is true but not covered by a test

- The lesson prose. Every command in it was run, and Task 04's notes record a
  correction where that claim had been true of Git Bash but not PowerShell.
  Whether the writing teaches is a judgement no test makes.
- The sixteen test questions. All are answerable from the lessons; whether the
  distractors are fair is the same kind of judgement.
- Importing a root into a browser trust store on macOS, and in Firefox on any
  system. The Windows path through Chrome was walked by hand on 2026-09-07.
- Docker Desktop installing cleanly on a machine that does not have it.

## The success signal

"At least one staff member has passed the test, and the admin view shows where
people got stuck" is a month away and cannot be checked here. Everything it
needs is in place: the test records a pass with focus areas, and the admin page
and export show them.
