<!-- Generated from docs/intake.md by kickoff v0.1.0. Edit the intake, not this file. -->

# 01: Walking skeleton

**What to build:** The thinnest version of "It must confirm their knowledge that they were able to apply and deploy; include a test phase they have to complete to pass" that works end to end. The app starts, a student can reach the one page that path needs, the test page, answer one question, and see the result recorded as a pass or a fail. Default styling, no sign-in, no second feature.

**Blocked by:** None. Phase 0 of the runbook must be complete first: database reachable, `.env` filled.

**Status:** ready

## Steps, in order

1. Create the app in this directory: `pnpm dlx create-next-app@latest . --typescript --app --src-dir --eslint --tailwind --import-alias "@/*" --use-pnpm`. The directory holds only docs, so nothing is overwritten.
2. Prisma: `pnpm add -D prisma`, `pnpm add @prisma/client`, `pnpm prisma init --datasource-provider postgresql`. Confirm `DATABASE_URL` in `.env` matches the runbook's database step.
3. Add the first model the most important path needs to `prisma/schema.prisma`: `TestAttempt` with an id, the placeholder student key from the Notes below, `passed`, and `createdAt`. Then `pnpm prisma migrate dev --name init`.
4. Tests: `pnpm add -D vitest` and a `test` script. First test at `src/lib/score.test.ts` on a pure function, `score(answers)` returning pass or fail; no database.
5. CI for GitHub. Write `.github/workflows/ci.yml`:

   ```yaml
   name: ci
   on:
     push:
       branches-ignore: [main]
     pull_request:
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: pnpm/action-setup@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 22
         - name: Install
           run: pnpm install
         - name: Test
           run: pnpm test
   ```

   `pnpm/action-setup@v4` needs a `packageManager` field in `package.json`; add `"packageManager": "pnpm@<installed version>"` when `create-next-app` did not write it.
6. The one page at `src/app/test/page.tsx` for the most important path: one question, a submit, and the result written as a `TestAttempt` through Prisma and shown back as pass or fail.
7. `README.md`: install, dev, test commands. Check they match `CLAUDE.md`.
8. Before writing code, start the branch `feature/walking-skeleton` from `main`; commit there, and open the pull request when the criteria pass.

## Acceptance criteria

- [ ] `pnpm dev` starts with no errors and the test page responds.
- [ ] `pnpm test` passes with at least one test.
- [ ] `pnpm prisma migrate dev` has been run once and `prisma/migrations/` is committed.
- [ ] "It must confirm their knowledge that they were able to apply and deploy; include a test phase they have to complete to pass" can be demonstrated in its thinnest form.
- [ ] CI is green on GitHub for this branch.
- [ ] `.env.example` lists `DATABASE_URL` and every other variable the code reads; no secret is in the repository.

## Suggested skills

- `plan`: before step 1, to restate the task and list the risks.
- `tdd`: write `score.test.ts` before `score.ts`.
- `setup-pre-commit`: once the app exists, add the pre-commit hooks for formatting, type checking, and tests.
- `build-fix`: when `create-next-app` or the first build fails.

## Notes

Keep the skeleton test free of the database so CI needs no service. Playwright is installed by the first slice with a screen to test, with `pnpm playwright install`.

The most important path needs a signed-in user and sign-in does not exist yet. Use one fixed placeholder identity, a constant in code and never a real account, and name it as such; Task 02 replaces it with the Auth.js user.
