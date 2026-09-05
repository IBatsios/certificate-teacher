<!-- Generated from docs/intake.md by kickoff v0.1.0. Edit the intake, not this file. -->

# 04: Deploy the certificate: https in the browser, a reverse proxy, a Java keystore

**What to build:** The second half of "As a student, I can generate my own certificates, deploy them, and test using a reverse proxy and with Java". From the user's side: in the same session, the student continues to the deploy lesson and works through three parts, each with a why and a do: trust their root certificate in the browser and see the padlock on a local https page; put a reverse proxy in front of a local service using their certificate; import the certificate into a Java keystore with `keytool` and see a Java program connect without a trust error. Each part is ticked done as in Task 03.

**Blocked by:** 01, 02, 03.

**Status:** ready

## Steps, a vertical slice in this order

1. Schema: no new entity; the deploy parts are new step keys under the session's `StepProgress`. If a step needs data beyond done-at, add it and run `pnpm prisma migrate dev --name deploy-steps`.
2. Data access: extend `src/lib/learning-session.ts` with whatever the new steps need, tests first; a session's completion now means every certificate and deploy step is done.
3. Interface: `src/app/lessons/deploy/page.tsx`, with the three parts in `content/lessons/deploy/*.md`. The reverse proxy the lesson teaches is not specified in the intake; pick one (Caddy or nginx) and record it in `docs/DECISIONS.md`.
4. Walk the story as the student would. Add the end-to-end test at `e2e/deploy-the-certificate.spec.ts`: all three parts can be ticked and the session shows complete.
5. Update `README.md` or `CLAUDE.md` if a command changed.

## Acceptance criteria

- [ ] As a student, I can deploy my certificate and test it with a reverse proxy and with Java: demonstrated end to end.
- [ ] Vitest covers the data-access functions as a caller would observe them, and passes.
- [ ] The end-to-end test passes.
- [ ] Any migration is committed under `prisma/migrations/`.
- [ ] Every earlier test still passes; CI is green.
- [ ] Any new environment variable is in `.env.example` with a placeholder.

## Suggested skills

- `frontend-patterns`: the lesson pages share structure with Task 03; reuse it.
- `e2e-testing`: the second Playwright test.

## Notes

The app never runs Java or a reverse proxy itself (13.1). The student does both on their machine; the lesson tells them what they should see, and Task 05 is where the app checks their certificate.
