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

### 0.6 Push and open the first pull request

```
git push -u origin feature/initial-scaffold
```

Then open a pull request on GitHub from `feature/initial-scaffold` to the default branch.

### 0.7 Before every migration from now on

There is no staging environment. Back up the database before each migration. In development, with the compose database running:

```
docker compose exec -T db pg_dump -U teacher teacher > "backup-$(Get-Date -Format yyyy-MM-dd).sql"
```

In production, take a backup of the PostgreSQL service in the Railway dashboard before merging a migration to the default branch.

## Phase 1 — build

Pick the next task from the **frontier**: any task whose "Blocked by" list is entirely done. Finish it to its acceptance criteria before starting another. Each task lives in `docs/tasks/`.

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

## Done

v1 is done when the last task's acceptance criteria, which are the intake's definition of done, are all checked.
