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
| D16 | Three small additions the task file did not name: the home page's boilerplate replaced by one paragraph and a link to `/test`; Zod for the server action's form validation; the Next-generated `AGENTS.md` committed | The scaffold's demo page is not the product; the Projects-root conventions say Zod at every boundary; `next dev` re-creates `AGENTS.md`, so committing it keeps the tree clean | Task 01 review |
| D17 | Sessions are JSON web tokens in the cookie, with the Prisma adapter still in place for users and magic-link tokens | Auth.js throws `UnsupportedStrategy` when a Credentials provider runs with database sessions, and the magic link needs the adapter for its one-time token. The cookie's role is a snapshot; `src/lib/session.ts` re-reads the role from the database before pages and actions act. Amends the architecture doc's "sessions live in the database" | Task 02 |
| D18 | Magic-link email goes over SMTP through Auth.js's Nodemailer provider: Mailpit in development (`docker-compose.override.yml`, inbox at `http://localhost:8026`), any SMTP service in production, Resend's suggested. Variables `EMAIL_SERVER` and `EMAIL_FROM` replace `AUTH_RESEND_KEY` | Nothing needs an account to develop or test, the browser tests read the link from Mailpit, and switching providers later is an environment change only. Answers intake 7.1 | Task 02 |
| D19 | The first admin is whoever signs up with the address in `ADMIN_EMAIL`; everyone else starts as a student | No seed script and no first-user-wins rule; roles change afterwards on `/admin/users` | Task 02 |
| D20 | Visitors reach `/`, `/sign-in`, `/sign-up`, `/check-your-email`, and `/forbidden`; every other path needs a sign-in | The home page holds nothing sensitive and carries the sign-in link. Answers intake 6.4 | Task 02 |
| D21 | Role areas are exclusive: `/test` is for students, `/admin` for the admin; the admin uses a separate student account to walk the lessons | The PRD's role table lists what each role can do and the acceptance criterion says each role reaches exactly its allowed actions. Answers intake 6.3 | Task 02 |
| D22 | Role changes follow two rules: nobody changes their own role, and the last admin cannot be demoted. The decision is the pure `src/lib/role-change.ts` | Keeps someone able to manage roles at all times; pure so the rules have unit tests instead of database-dependent ones | Task 02 |
| D23 | Browser tests arrive in this task: Playwright under `e2e/`, the app on port 3100 with a per-run `ADMIN_EMAIL`, accounts ending in `@e2e.test` removed by a global teardown, and a second CI job with Postgres and Mailpit services | Sign-in working is the first line of the definition of done, and unit tests cannot prove it. Task 01 said the first slice with a screen installs Playwright; this is that slice | Task 02 |
| D24 | No rate limiting on sign-in yet | argon2 makes guessing slow and the audience is a handful of staff. Revisit in Task 08 with the platform's limiter, since a per-process counter would be wrong on a redeploy | Task 02 |
| D25 | `argon2` is allowed to run its build script in `pnpm-workspace.yaml` | pnpm 10 blocks install scripts by default; the package ships prebuilt binaries and the script only picks one | Task 02 |
| D26 | The route guard is `src/proxy.ts`, the Next 16 name for middleware, on the Node runtime. It decodes the cookie only, through `src/auth.config.ts`, which has no adapter; `src/auth.ts` adds the adapter and providers for pages and actions | Next's guidance: proxy checks are optimistic, the real check sits next to the data. The split keeps Prisma out of the proxy bundle | Task 02 |
| D27 | The Auth.js token type is not augmented; `src/auth.config.ts` validates the role found in the token at runtime with `isRole` | `next-auth/jwt` only re-exports `@auth/core/jwt`, which pnpm keeps out of root resolution, so an augmentation never merges. A runtime check also survives a bad or old cookie | Task 02 |
| D28 | The role change runs as one serializable transaction in `src/lib/users.ts`: read the target and the admin count, decide, write | Separate statements let two admins demote each other at the same moment and leave nobody in charge. Postgres aborts one of the two with a write conflict, shown as "could not be saved, try again" | Task 02 review |
| D29 | Whether an email has an account is not hidden: the sign-up page says so plainly, and sign-in with a password answers faster for an unknown email than for a wrong one | A clear message matters more to this audience than hiding it, and closing the timing channel alone would change nothing while the message stays. Revisit with rate limiting in Task 08 | Task 02 review |
| D30 | The admin account can only be created by a magic link; a password sign-up with the address in `ADMIN_EMAIL` is refused | Typing an address proves nothing, so a password sign-up could have claimed the admin role before the real admin did. A magic link proves the mailbox. Setting a password on the admin account afterwards is not built yet | Task 02 review |
| D31 | A role change applies after the person signs out and in again, and the forbidden page tells them so when it sees the cookie's role differ from the database's | The role in the cookie is only rewritten at sign-in (D17). Without the notice, a promoted person bounced between the forbidden page and their old home with no way out | Task 02 review |
