# Handoff — after Task 02, sign-in and roles

**Date:** 2026-09-06
**Phase finished:** Task 02: sign-up and sign-in with a password or a magic link, two roles enforced everywhere, the admin's users page
**Next phase:** push, open the pull request, watch both CI jobs, merge; then Task 03 (the certificates lesson) or Task 08 (deploy), both on the frontier

## Where things stand

- Branch `feature/sign-in`, off `main`. Nothing else is in flight.
- Auth.js 5 (beta 32) with the Prisma adapter. Two providers: Credentials with argon2 hashes, and Nodemailer for magic links. Sessions are JSON web tokens in the cookie (D17). Configuration is split: `src/auth.config.ts` has no database and feeds the proxy; `src/auth.ts` adds the adapter and providers for pages and actions.
- Roles: the `Role` enum on `User`, `student` by default. The admin is whoever owns the address in `ADMIN_EMAIL`: the first magic link with it creates the admin account, and a password sign-up with it is refused (D19, D30). The matrix is data in `src/lib/access.ts`: `/test` is the students' area, `/admin` the admin's, and `/`, `/sign-in`, `/sign-up`, `/check-your-email`, `/forbidden` are open to everyone (D20, D21). `src/proxy.ts` applies it from the cookie; `requireRole` in `src/lib/session.ts` applies it again from the database inside every page and action.
- Screens: `/sign-in` (password form and magic-link form), `/sign-up`, `/check-your-email`, `/forbidden`, `/admin/users` (list, one button per row to swap the role), and a header on every page with the signed-in email and a sign-out button. Every message a person can see lives in a `messages.ts` next to its page, keyed by the value in the URL, as in Task 01.
- `TestAttempt.studentKey` is gone; attempts belong to `userId`, and the `/test?attempt=<id>` lookup is scoped to the signed-in student. The placeholder identity file is deleted. Migration `20260906184654_auth` deletes the placeholder attempts before adding the column.
- Email in development goes to Mailpit, started by `docker-compose.override.yml` (D18). SMTP on 1025, inbox at `http://localhost:8026`; 8025 belongs to another project on this machine.
- Tests: 28 unit tests (the access matrix, the new-user role, the password helpers, the role-change rules) and 9 Playwright journeys under `e2e/` (password sign-up, sign-out, sign-in, wrong password, duplicate sign-up; magic link, and a used link refused; the student and admin areas, the admin address refused at password sign-up, and a promotion followed by the promoted person signing in again). `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm test:e2e` all pass. gitleaks finds nothing.
- CI has a second job with Postgres and Mailpit services that migrates, builds, and runs the browser tests; the Playwright report is kept when it fails.
- Decisions D17 to D31 in `docs/DECISIONS.md`; D28 to D31 came out of the pre-commit security and code reviews. Intake answers 6.3, 6.4, and 7.1 are filled in so a regenerate keeps them.

## Things the next session should know

- `docker-compose.yml`, `.gitignore`, and `.env.example` are generated files that Task 01 and Task 02 extended. After a kickoff regenerate, re-apply: the `backup-*.sql` and Playwright ignores, and the `EMAIL_SERVER`, `EMAIL_FROM`, and `ADMIN_EMAIL` variables. The compose override is not generated and survives on its own.
- The browser tests start their own app on port 3100 with a per-run `ADMIN_EMAIL` and `AUTH_TRUST_HOST=true`, create accounts ending in `@e2e.test`, and delete them in `e2e/global-teardown.ts` through the `pg` driver. The Prisma client cannot be imported there: Playwright loads files as CommonJS and the generated client uses `import.meta`.
- `pnpm playwright install chromium` fetches both the full browser and `chromium-headless-shell`, which the runner uses. On this machine the first install left the headless shell out for no visible reason; if a run complains that an executable does not exist, run `pnpm playwright install chromium-headless-shell` and try again.
- A `"use server"` file may export only async functions. Constants shared with a page go elsewhere; `MIN_PASSWORD_LENGTH` is in `src/lib/password.ts` for that reason.
- The Auth.js token type is not augmented (D27). The role in the cookie is validated with `isRole` in `src/auth.config.ts`; if that ever fails, the person is treated as a student at the proxy and the database check decides for real.
- Next injects an empty `role="alert"` live region on every page for route announcements. Tests that look for the page's own message use `pageMessage()` in `e2e/helpers.ts`, which scopes to `<main>`.
- Task 01's note still holds: the `pnpm dev` server takes port 3001 here because 3000 is busy.
- A role change applies after the person signs out and in again (D31): the cookie keeps the old role, so `requireRole` sends them to `/forbidden`, which notices the mismatch, explains, and offers the sign-out button. `e2e/roles.spec.ts` walks that path. The admin's own account has no password; a "set a password" flow is not built.
- Rate limiting on sign-in is deliberately absent (D24). Task 08 should add the platform's limiter in front of `/api/auth` and the sign-in actions.
- `AUTH_TRUST_HOST=true` will be needed on Railway (Task 08); the e2e config already sets it for `next start`.

## What to do next, in order

1. `git push -u origin feature/sign-in`, open the pull request to `main`, and wait for both CI jobs. Tick the last box in `docs/tasks/02-sign-in.md` when they are green.
2. Merge. Then pick from the frontier: Task 03 (certificate chains lesson; needs a `LearningSession` model and the lesson content) or Task 08 (deploy to Railway; needs a Railway account, a Postgres service, an SMTP service for magic links, and the variables in `.env.example`). Task 03 is the product; Task 08 gets the sign-in in front of real people sooner.
3. Whichever comes first, protect `main` on GitHub (runbook 0.6, still open) and run `/project-init` (runbook 0.5, still open).
4. When a phase ends, write the next handoff doc here, in this shape.

## Suggested skills for the next session

- `plan` and `tdd`: at the start of the next task.
- `frontend-design-direction`, `make-interfaces-feel-better`, `front-a11y`: Task 03 is the first lesson screen, and its readers have no technical experience.
- `e2e-testing`: extending `e2e/` for the lesson.
- The full list, with when to use each, is in `CLAUDE.md`.
