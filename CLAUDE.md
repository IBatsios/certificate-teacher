<!-- Generated from docs/intake.md by kickoff v0.1.0. Edit the intake, not this file. -->

# CLAUDE.md — teacher

Teacher is an app that teaches users how certificate chains work, how to get https in your browser, import certs into a Java keystore (and why it's necessary), and how to set up a reverse proxy. Users: anyone who wants to learn, developed for no technical experience, plus one admin who views results and progress. The most important path is confirming a student's knowledge that they were able to apply and deploy, with a test phase they have to complete to pass.

## Stack

TypeScript, Next.js with route handlers, PostgreSQL with Prisma, Tailwind, Vitest and Playwright, pnpm. Details in `docs/ARCHITECTURE.md`.

## Conventions

- Work on a branch named `feature/<short-description>`, `fix/<short-description>`, or `chore/<short-description>`; merge to the default branch through a pull request.
- Commit messages: conventional commits with types feat, fix, chore, docs, test, refactor.
- Every new environment variable is added to `.env.example` with a placeholder. Secrets never go in code or commits.
- Back up the database before running a migration.
- At the end of a phase, write a handoff doc in `docs/handoff-items/`.

## Run and test

```
pnpm install
pnpm dev
pnpm test
```

## Where things are

- `docs/PRD.md`: what and why. `docs/ARCHITECTURE.md`: how. `docs/DECISIONS.md`: what was decided and why; append new decisions there.
- `docs/RUNBOOK.md`: what to do next. Phase 0 is done by a person. Phase 1 is the task list.
- `docs/tasks/`: one file per task. Pick any task whose "Blocked by" list is entirely done. Finish it to its acceptance criteria before starting another.
- `docs/intake.md`: the source all of the above was generated from. Change the intake and run `/kickoff` to regenerate; edits to generated files are lost on regenerate.

## Skills to use

- `project-init`: once, in Phase 0, to install the ECC rules for this stack.
- `plan`: at the start of a task, to restate it and list the risks before touching code.
- `tdd`: in every task, tests before implementation.
- `coding-standards`: while writing any code.
- `frontend-patterns`: the lesson, test, and admin pages.
- `backend-patterns` and `api-design`: the route handlers and the Auth.js setup.
- `error-handling`: the certificate upload and every message a student sees.
- `e2e-testing`: the Playwright tests from Task 03 on.
- `frontend-design-direction`, `make-interfaces-feel-better`, `front-a11y`: the lesson and test screens, whose readers have no technical experience.
- `code-review`, `security-scan`, `verification-loop`, `test-coverage`: before each pull request.
- `build-fix`: when the build or type check breaks.
- `setup-pre-commit`: once, in Task 01.
- `writing-for-agents`: when editing this file.
- `mermaid`: diagrams in `docs/ARCHITECTURE.md`.
- `handoff`: at the end of a phase.
