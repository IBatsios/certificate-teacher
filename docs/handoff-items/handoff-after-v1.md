# Handoff — after v1

**Date:** 2026-09-07
**Phase finished:** v1. Tasks 01 to 09, all merged, all acceptance criteria met.
**Next phase:** v2, once the success signal has had time to arrive.

## Where things stand

Teacher is live at <https://teacher.ioannisbatsios.com>, running 9fd1c7b, the
merge of pull request #16. A student can sign up, work through two lessons,
have their certificate checked, take a sixteen-question test, and start over
without losing anything. The admin can see everyone's progress and download it.

- 151 unit tests in 18 files, 35 Playwright journeys in 9 files, both green in
  CI on every pull request.
- 64 decisions in `docs/DECISIONS.md`.
- Four migrations in `prisma/migrations/`.
- Deploys happen on a push to `main`; CI deliberately does not run on `main`
  (`branches-ignore`), because everything is meant to arrive through a checked
  pull request.

## What v2 should start with

**1. Walk the lesson on a machine that is not this one.** This is the highest
value thing left and the only one that needs a person. Three paths are written
from documentation rather than from having been run: importing a root into
Keychain on a Mac, importing it into Firefox on any system, and installing
Docker Desktop on a machine without it. The Windows and Chrome path was walked
by hand and found two real bugs, which is the reason to expect the others to
hold some too.

**2. Decide whether the admin should land on the report.** Signing in as the
admin still lands on `/admin/users`, the roles page, although the intake
describes the admin as the person who views results and progress. One line in
`HOME_BY_ROLE` and two test updates. Left alone in Task 07 because it was a
behaviour change that task did not ask for.

**3. Close the rate-limit gap in `sign-in-limits.ts`.** Task 05 split
`certificate-limits.ts` so its wiring could be tested, and found that the
original `a && b` meant a student already over their limit stopped counting
against the address. `sign-in-limits.ts` still has that shape, untested, from
Task 08. The same split would take an hour and would answer whether it has the
same flaw.

**4. Read the sixteen test questions as a student would.** They are answerable
from the lessons and the correct answer is no longer always first, which review
caught. Whether the wrong answers are fair, and whether the wording reads the
way it was meant to for someone with no technical experience, has not been
judged by anyone but the person who wrote them.

## Things a future session should know

- **`docs/intake.md` is the source.** `docs/PRD.md`, `docs/ARCHITECTURE.md`,
  and every file in `docs/tasks/` were generated from it. **Do not run
  `/kickoff` to regenerate.** Several of those files have been edited by hand
  since: every task file carries its acceptance criteria and build notes, and
  `docs/DECISIONS.md` has D51 to D64 appended. A regenerate would overwrite all
  of it.
- **Vitest runs one file at a time** (`fileParallelism: false`, D57). Two files
  writing to the one development database at serializable isolation produced
  write conflicts and deleted each other's fixtures. Each data-access test file
  also cleans up only its own users, by email suffix.
- **A `shell` fence in the lesson content means the command is the same in
  PowerShell and in Terminal**, so it has to be run in both. Task 04 shipped a
  Java command that worked in Git Bash and failed in PowerShell, because it was
  only ever run in one.
- **The database is backed up before every migration**, by hand, with
  `pg_dump` through Docker. The backups are gitignored and sit in the repository
  root.
- **Docker Desktop is a student prerequisite now** (D51), recorded in the intake
  at 3.4, 12.5, and 13.1 so a regenerate would keep it.

## What v1 deliberately does not do

From intake 13.1, unchanged: no course authoring interface, no running Java or
a reverse proxy inside the app, no certificate authority service, no mobile
layout. Section 13.2 also says no to teaching other security topics and to team
accounts, both until someone actually needs them.

## The success signal

"At least one staff member has passed the test, and the admin view shows where
people got stuck", one month after launch. Everything it needs is built. The
first thing to do when it arrives is open `/admin` and look at the focus areas
column: if everyone is stuck on the same topic, that is a lesson to rewrite,
not a student problem.
