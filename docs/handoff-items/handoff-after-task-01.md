# Handoff — after Task 01, the walking skeleton

**Date:** 2026-09-06
**Phase finished:** Task 01: the app exists, the most important path works end to end in its thinnest form
**Next phase:** push, open the pull request, watch CI, merge; then Task 02, sign-in and roles

## Where things stand

- Branch `feature/walking-skeleton`, off `main`. Not pushed. Nothing else is in flight.
- The app: Next.js 16.3 App Router with Turbopack, TypeScript strict, Tailwind 4, ESLint, pnpm 10. Home page links to `/test`.
- `/test` shows one question. Submitting runs the server action in `src/app/test/actions.ts`, which validates with Zod, scores with the pure `score()` in `src/lib/score.ts`, writes a `TestAttempt` through Prisma, and redirects to `/test?attempt=<id>`, where the result is read back from Postgres and shown as "You passed" or "Not yet". An unanswered or unsaved submission comes back with a plain-language message.
- Every attempt is recorded against the placeholder key in `src/lib/placeholder-student.ts`. Task 02 replaces it with the signed-in user and deletes that file.
- Prisma 7.10.0, pinned (see D8 to D14 in `docs/DECISIONS.md`). Config in `prisma7.config.ts`, client generated into `src/generated/prisma` on install. One migration, `20260906045130_init`.
- Tests: Vitest, four cases on `score()`, no database. `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` all pass.
- Pre-commit hook (Husky, lint-staged with Prettier and ESLint, then type check and tests). CI workflow at `.github/workflows/ci.yml` runs the same three checks on every branch push and pull request.

## Things the next session should know

- Port 3000 on this machine belongs to another app behind Docker's WSL relay, so `pnpm dev` picks 3001. Read the port from the dev server's first lines.
- After changing `prisma/schema.prisma`, run `pnpm prisma migrate dev --name <change>` and then `pnpm prisma generate`; in this Prisma version the migration did not refresh the generated client.
- `prisma init` writes `prisma7.config.ts`, not `prisma.config.ts`, and the CLI loads it. Leave the name alone.
- The runbook's backup command, run from Windows PowerShell 5.1, writes a UTF-16 file that `psql` cannot restore. From bash, or with `| Out-File -Encoding utf8`, it is fine. The intake owns the runbook, so fix the wording there.
- `/project-init` (runbook step 0.5) has not been run, and gitleaks is not installed; the grep fallback from step 0.4 was used before committing.

## What to do next, in order

1. `git push -u origin feature/walking-skeleton`, open the pull request to `main`, and wait for CI. Tick the last box in `docs/tasks/01-walking-skeleton.md` when it is green.
2. Merge, then start Task 02 from `main` on `feature/sign-in`: Auth.js with the Prisma adapter, `User` with a `student` or `admin` role, and `TestAttempt.userId` in place of `studentKey`. Note that Next 16 renamed `middleware.ts` to `proxy.ts`; read `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` first.
3. When a phase ends, write the next handoff doc here, in this shape.

## Suggested skills for the next session

- `plan` and `tdd`: at the start of Task 02.
- `backend-patterns` and `security-scan`: the Auth.js configuration and the route guard.
- The full list, with when to use each, is in `CLAUDE.md`.
