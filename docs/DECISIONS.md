<!-- Generated from docs/intake.md by kickoff v0.1.0. Edit the intake, not this file. -->

# teacher — Decisions

One line per decision. Newest at the bottom. Reasons come from the intake; where it gave none, the reason is "chosen in intake" and can be filled in later.

| # | Decision | Why | Source |
|---|---|---|---|
| D1 | Stack: TypeScript, Next.js, Next.js route handlers, PostgreSQL with Prisma, Tailwind, tests with Vitest and Playwright, pnpm | Chosen in intake. 8.11 adds Auth.js for email-and-password plus magic link, and `@peculiar/x509` for parsing the certificates students upload | Section 8 |
| D2 | Code lives on GitHub, public, licensed MIT | chosen in intake | Section 9 |
| D3 | Runs on Railway; environments: development, production | chosen in intake | Section 10 |
| D4 | Development database: Docker Compose | chosen in intake | Section 10 |
| D5 | Sign-in via email and password, magic link; roles: student, admin | chosen in intake | Sections 3, 6 |
| D6 | handoff_docs: true (differs from the default false) | chosen in intake | Section 9 |

---

## Added after the build
