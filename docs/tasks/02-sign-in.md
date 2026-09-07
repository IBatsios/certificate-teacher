<!-- Generated from docs/intake.md by kickoff v0.1.0. Edit the intake, not this file. -->

# 02: Sign-in and roles

**What to build:** A student or admin can sign up and sign in with email and password, magic link, and the app knows which role they hold. Visitors who are not signed in can reach only the sign-in and sign-up pages: 6.4 was not answered, so change this if they should see more. An admin can change other users' roles.

**Blocked by:** 01.

**Status:** done. Merged to `main` through pull request #2 on 2026-09-06 with CI green.

## Steps, in order

1. Install Auth.js with the Prisma adapter: `pnpm add next-auth@beta @auth/prisma-adapter`.
2. Schema: add the Auth.js models (`User`, `Account`, `Session`, `VerificationToken`) to `prisma/schema.prisma`, plus a `role` enum on `User` with the values `student` and `admin`. Then `pnpm prisma migrate dev --name auth`.
3. Secret: `pnpm dlx auth secret` writes `AUTH_SECRET` to `.env`; add the placeholder to `.env.example`.
4. Providers, one per method in email and password, magic link: magic link takes an email sender and its key (`AUTH_RESEND_KEY` for Resend, or the Auth.js variable for the provider you pick; the intake did not choose one, so record the choice in `docs/DECISIONS.md`); email and password uses the Credentials provider with argon2 hashing (`pnpm add argon2`).
5. Guard: `src/middleware.ts` matching every protected path that reads the session and enforces the role matrix from `docs/PRD.md`.
6. Replace the placeholder identity from Task 01 with the signed-in user: `TestAttempt` gets a `userId`.
7. Tests: a signed-out request to a protected page is redirected or refused; each role reaches exactly its allowed actions.

## Acceptance criteria

- [x] Sign-in works with every method in email and password, magic link, and sign-out ends the session. (Playwright: `e2e/password-sign-in.spec.ts`, `e2e/magic-link.spec.ts`.)
- [x] A new user can sign up and sign back in. (Both methods; a first magic link creates the account.)
- [x] Every row of the role matrix is enforced and has a test. (`src/lib/access.test.ts` for the matrix, `e2e/roles.spec.ts` for the pages, `src/lib/role-change.test.ts` for role changes.)
- [x] `AUTH_SECRET` and every provider credential are in `.env` only, with placeholders in `.env.example`. (`EMAIL_SERVER`, `EMAIL_FROM`, `ADMIN_EMAIL` replace `AUTH_RESEND_KEY`; see D18.)
- [x] The auth migration is committed under `prisma/migrations/`. (`20260906184654_auth`; it deletes the placeholder attempts first.)
- [x] Earlier tests still pass; CI is green. (28 unit and 9 browser tests; both CI jobs green on pull request #2.)

## Suggested skills

- `backend-patterns`: the Auth.js configuration and the middleware.
- `security-scan`: before committing the auth code.
- `tdd`: the role-matrix tests first.

## Notes

Auth.js treats email and password as the least preferred method; keep it only if the intake asked for it, and never store a password without hashing.
