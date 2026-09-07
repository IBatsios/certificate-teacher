<!-- Generated from docs/intake.md by kickoff v0.1.0. Edit the intake, not this file. -->

# 04: Deploy the certificate: https in the browser, a reverse proxy, a Java keystore

**What to build:** The second half of "As a student, I can generate my own certificates, deploy them, and test using a reverse proxy and with Java". From the user's side: in the same session, the student continues to the deploy lesson and works through three parts, each with a why and a do: trust their root certificate in the browser and see the padlock on a local https page; put a reverse proxy in front of a local service using their certificate; import the certificate into a Java keystore with `keytool` and see a Java program connect without a trust error. Each part is ticked done as in Task 03.

**Blocked by:** 01, 02, 03.

**Status:** built on `feature/deploy-lesson` on 2026-09-06. Unit tests (71) and Playwright (17) green locally; pull request and CI pending.

## Steps, a vertical slice in this order

1. Schema: no new entity; the deploy parts are new step keys under the session's `StepProgress`. If a step needs data beyond done-at, add it and run `pnpm prisma migrate dev --name deploy-steps`.
2. Data access: extend `src/lib/learning-session.ts` with whatever the new steps need, tests first; a session's completion now means every certificate and deploy step is done.
3. Interface: `src/app/lessons/deploy/page.tsx`, with the three parts in `content/lessons/deploy/*.md`. The reverse proxy the lesson teaches is not specified in the intake; pick one (Caddy or nginx) and record it in `docs/DECISIONS.md`.
4. Walk the story as the student would. Add the end-to-end test at `e2e/deploy-the-certificate.spec.ts`: all three parts can be ticked and the session shows complete.
5. Update `README.md` or `CLAUDE.md` if a command changed.

## Acceptance criteria

- [x] As a student, I can deploy my certificate and test it with a reverse proxy and with Java: demonstrated end to end. Every command in the lesson was run while writing it, except the browser trust import, which is a GUI step (see the note below).
- [x] Vitest covers the data-access functions as a caller would observe them, and passes. `learning-session.ts` needed no change, so its Task 03 tests still stand; the new pure functions `courseProgress` and the lesson routes are covered.
- [x] The end-to-end test passes: `e2e/deploy-the-certificate.spec.ts`, three journeys.
- [x] Any migration is committed under `prisma/migrations/`. None was needed: `StepProgress.stepKey` is a free-form string, so the deploy steps are new key values and nothing here needs data beyond `doneAt`. Step 1 of this task suggested a migration; it would have been empty.
- [x] Every earlier test still passes locally. CI is green: pending the pull request.
- [x] Any new environment variable is in `.env.example` with a placeholder. None was added.

## Suggested skills

- `frontend-patterns`: the lesson pages share structure with Task 03; reuse it.
- `e2e-testing`: the second Playwright test.

## Notes

The app never runs Java or a reverse proxy itself (13.1). The student does both on their machine; the lesson tells them what they should see, and Task 05 is where the app checks their certificate.

## Notes from building it

The reverse proxy is nginx in Docker Compose (D51), which adds Docker Desktop as a
student prerequisite. The lesson is four step files, not three: `01-start-the-site`
checks for Docker and starts the stack, and the three parts the task names follow it.
Step 2 and step 3 share one running stack, so the student starts it once.

Verified while writing, on Windows with OpenSSL 3.5.7 and JDK 25:

- the chain nginx serves verifies against the student's own root, `Verify return code: 0 (ok)`
- the backend reports `RemoteAddr` as the proxy, a plain `GET / HTTP/1.1`, and `X-Forwarded-Proto: https`
- `java TrustCheck.java` fails with `unable to find valid certification path to requested target`, and passes with `Connected. HTTP 200` after the `keytool` import

Not verified: importing the root into a browser's trust store, which is a GUI
step on every platform, and the Docker Desktop install on a clean machine. The
same caveat D35 records for the Windows OpenSSL path applies here.
