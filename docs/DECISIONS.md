<!-- Generated from docs/intake.md by kickoff v0.1.0. Edit the intake, not this file. -->

# teacher — Decisions

One line per decision. Newest at the bottom. Reasons come from the intake; where it gave none, the reason is "chosen in intake" and can be filled in later.

| # | Decision | Why | Source |
|---|---|---|---|
| D1 | Stack: TypeScript, Next.js, Next.js route handlers, PostgreSQL with Prisma, Tailwind, tests with Vitest and Playwright, pnpm | chosen in intake | Section 8 |
| D2 | Must use: Auth.js for email-and-password plus magic link; `@peculiar/x509` for parsing the certificates students upload | chosen in intake | Section 8 |
| D3 | Code lives on GitHub, public, licensed MIT | chosen in intake | Section 9 |
| D4 | Runs on Railway; environments: development, production | chosen in intake | Section 10 |
| D5 | Development database: Docker Compose | chosen in intake | Section 10 |
| D6 | Sign-in via email and password, magic link; roles: student, admin | chosen in intake | Sections 3, 6 |
| D7 | handoff_docs: true (differs from the default false) | chosen in intake | Section 9 |

---

## Added after the build

| # | Decision | Why | Source |
|---|---|---|---|
| D8 | Prisma pinned to 7.10.0 for the CLI, `@prisma/client`, and `@prisma/adapter-pg` | On 2026-09-06 the CLI's `latest` tag pointed at an 8.0 release candidate while the client's was 7.10.0; matched stable versions, with the v7 docs at prisma.io/docs/orm/v7 | Task 01 |
| D9 | Prisma 7 layout: `prisma7.config.ts` as `prisma init` writes it, client generated into `src/generated/prisma` (gitignored) by a `postinstall` script, Postgres reached through `@prisma/adapter-pg` | Prisma 7 requires a config file and a driver adapter; keeping the tool's own file name avoids fighting it | Task 01 |
| D10 | The Next.js app was scaffolded in a scratch folder and copied in | `create-next-app` refuses a directory holding `CLAUDE.md`, `.env`, `docker-compose.yml`, or a README | Task 01 |
| D11 | Vitest runs in Node only, for `src/**/*.test.ts`; no jsdom or Testing Library until a component test needs them. End-to-end tests are Playwright's, under `e2e/` | YAGNI; keeps CI free of a browser until Task 03 | Task 01 |
| D12 | CI runs lint and type check as well as the tests | Same three checks as the pre-commit hook, so a green pull request means the same thing locally and on GitHub | Task 01 |
| D13 | Skeleton pass rule: every question answered correctly. Placeholder until Task 06 sets the real pass mark | One question exists; any other rule would be invented | Task 01 |
| D14 | `.gitignore` excludes `backup-*.sql`, the files the runbook's backup step writes into the project root | A database dump must never be committed | Task 01 |
| D15 | Prettier and lint-staged skip `docs/` | `docs/intake.md` is hand-written and the rest is generated from it; tooling must not rewrite either | Task 01 |
