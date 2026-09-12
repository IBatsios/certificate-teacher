<!-- Generated from docs/intake.md by kickoff v0.1.0. Edit the intake, not this file. -->

# teacher — Runbook

Phase 0 is for a person: it needs accounts, passwords, and judgement. Phase 1 is for whoever builds, agent or human, one task at a time.

## Phase 0 — before any code

### 0.1 Create the remote

```
gh auth login
gh repo create IBatsios/teacher --public --source=. --remote=origin
```

If the CLI is not installed: create the repository at `https://github.com/new` with the name `teacher`, visibility public, no README, then:

```
git remote add origin https://github.com/IBatsios/teacher.git
```

### 0.2 Development database

`docker-compose.yml` at the project root defines a PostgreSQL 16 service. Start it and check it is up:

```
docker compose up -d
docker compose ps
```

Connection string for `.env`: `DATABASE_URL="postgresql://teacher:teacher@localhost:5432/teacher"`. The compose password is a local development password on a port only this machine reaches; do not reuse it anywhere else.

Prove the connection:

```
docker compose exec db psql -U teacher -d teacher -c "select 1"
```

The first migration runs in Task 01, once the project exists.

### 0.3 Fill in `.env`

Copy `.env.example` to `.env` and fill every value. Where each one comes from:

- `DATABASE_URL`: the database step above.
- `AUTH_SECRET`: any long random string you generate. Task 02 can write one with `pnpm dlx auth secret`.
- `AUTH_RESEND_KEY`: the email provider's console. The intake did not choose a provider for magic-link email; pick one when you reach Task 02 and rename the variable to the one Auth.js expects for it.

`.env` is listed in `.gitignore`. Keep it there.

### 0.4 Scan for secrets

Install gitleaks: `winget install gitleaks` (or download the release binary from `https://github.com/gitleaks/gitleaks/releases`). Then run:

```
gitleaks detect --source . --no-banner
```

"No leaks found" means push. Anything else means remove the value from the file, rotate it with the provider that issued it, and run the scan again. Rotation matters even though nothing was pushed, because the value has been in a file on disk.

#### If gitleaks is not installed

Weaker, no install. It looks for the most common key shapes and a few telltale words.

```
Get-ChildItem -Recurse -File -Exclude *.lock | Where-Object { $_.FullName -notmatch '\\(\.git|node_modules)\\' } | Select-String -Pattern 'AKIA[0-9A-Z]{16}', 'sk-[A-Za-z0-9]{20,}', 'ghp_[A-Za-z0-9]{36}', 'glpat-[A-Za-z0-9_-]{20,}', 'BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY', '(password|secret|token|api_key)\s*[=:]\s*["''][^"'']{8,}'
```

No output means nothing matched. A match in `.env.example` with a placeholder value is fine; a match anywhere else is not.

`.env` is in `.gitignore` and must stay there. `.env.example` holds names and placeholder values only.

### 0.5 Install the ECC rules for this stack

Run `/project-init` in this directory and accept the plan it proposes.

### 0.6 Push

```
git push -u origin main
```

This build was a regenerate, committed on `feature/kickoff-regenerate` rather than `main`. Push it too, and merge it to `main` through a pull request before Task 01 starts:

```
git push -u origin feature/kickoff-regenerate
```

Task 01 opens the next pull request, from `feature/walking-skeleton` to `main`. Protect `main` in the repository settings on GitHub now that it exists.

### 0.7 Before every migration from now on

There is no staging environment. Back up the database before each migration. In development, with the compose database running:

```
docker compose exec -T db pg_dump -U teacher teacher > "backup-$(Get-Date -Format yyyy-MM-dd).sql"
```

In production, take a backup of the PostgreSQL service in the Railway dashboard before merging a migration to `main`.

## Phase 1 — build

Pick the next task from the **frontier**: any task whose "Blocked by" list is entirely done. Finish it to its acceptance criteria before starting another. Each task lives in `docs/tasks/`. Every task starts on its own branch from `main` and ends in a pull request.

| # | Task | Blocked by | Delivers |
|---|---|---|---|
| 01 | Walking skeleton | none | "It must confirm their knowledge that they were able to apply and deploy; include a test phase they have to complete to pass" works end to end in the thinnest form, one test, CI green |
| 02 | Sign-in and roles | 01 | Sign-up and sign-in with email and password or magic link; student and admin roles enforced |
| 03 | Learn certificate chains and generate a certificate | 01, 02 | The certificates lesson; progress saved, resumed, and start-over without loss |
| 04 | Deploy the certificate: https, reverse proxy, Java keystore | 01, 02, 03 | The deploy lesson; a session can be completed |
| 05 | Verify an uploaded certificate | 01, 02, 03 | A student's certificate is parsed and checked, with a verdict |
| 06 | The test phase with focus areas | 01, 02, 04 | Pass or fail per topic, focus areas recorded with the session |
| 07 | Admin view of progress and results, with export | 01, 02, 05, 06 | One page per student's progress and results; a downloadable export |
| 08 | Deploy to Railway | 01, 02 | Live at ioannisbatsios.com; migrations run on release |
| 09 | Definition of done for v1 | every other task | The intake's definition of done, verified |

## Phase 2 — the Docker course

The second course, and the machinery a second course needs. Same rule as Phase
1: pick any task whose "Blocked by" list is entirely done, finish it to its
acceptance criteria before starting another, one branch and one pull request
each. The plan behind this table, including why Docker replaced Kubernetes and
why the sandbox is a fallback rather than a foundation, is in
`docs/handoff-items/handoff-docker-course-plan.md`.

| # | Task | Blocked by | Delivers |
|---|---|---|---|
| 10 | Multi-course foundations | none | Teacher can hold more than one course: the catalog owns its lessons, sessions and attempts are scoped to a course, Docker replaces Kubernetes as the coming course |
| 11 | One lesson route | 10 | `/lessons/[slug]` serves every lesson; the finished panel becomes content. A refactor: no behaviour changes |
| 12 | Docker lesson 1, what a container actually is | 10, 11 | The Docker course opens, on the hook that the student already used Docker in the deploy lesson without being told what it was |
| 13 | Docker lesson 2, build your own image | 12 | A Dockerfile, the layer cache, tags, a multi-stage build, and the session's challenge token |
| 14 | Docker lesson 3, run it like a real thing | 13 | Ports, volumes, environment variables, networks, non-root and health checks, ending with their own image behind their own certificate on https |
| 15 | Verify a built image | 13, 14 | `DOCKER_CHECKS` judges a submitted `docker inspect`, storing the findings and never the raw input |
| 16 | The Docker test phase, and the report across both courses | 12, 13, 14, 15 | A sixteen-question test for the Docker course; the admin page and export show both courses |

Two migrations land in this phase, in Task 10 and Task 15. Back up the
database before each one, in development and in production, per 0.7.

## Done

v1 is done when the last task's acceptance criteria, which are the intake's definition of done, are all checked.

**v1 is done, on 2026-09-07.** All nine tasks are merged with CI green, and
Task 09 verified the intake's definition of done against `main` at 9fd1c7b,
which is the commit production is running. Live at
<https://teacher.ioannisbatsios.com>; the apex serves the personal website
(D40).

What to do next is in `docs/handoff-items/handoff-after-v1.md`. Do **not** run
`/kickoff` to regenerate this file or anything in `docs/tasks/`: they have been
edited by hand since they were generated, and a regenerate would overwrite the
acceptance criteria, the build notes, and D51 to D64.

**v2 is done** when Task 16's acceptance criteria are all checked: a student
can work through the Docker course, have what they built checked, pass its
test, and the admin can see both courses per student. The tasks for it, 10 to
16, are hand-written rather than generated, which is one more reason not to run
`/kickoff` here.
