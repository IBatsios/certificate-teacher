# teacher

Teacher is an app that teaches how certificate chains work, how to get https in your browser, how to import certificates into a Java keystore (and why), and how to set up a reverse proxy. Students prove they can apply it by passing a test; an admin sees everyone's progress and results.

## Run it

You need Node 22 or newer, pnpm 10, and Docker Desktop.

```
docker compose up -d        # PostgreSQL 16 on localhost:5432 and Mailpit, development only
cp .env.example .env        # then fill in every value
pnpm install                # also generates the Prisma client
pnpm prisma migrate dev     # applies the migrations to the development database
pnpm dev                    # http://localhost:3000
```

Sign-in emails in development go to Mailpit, not to a real inbox: open `http://localhost:8026` to read them. The admin is whoever owns the address in `ADMIN_EMAIL`: ask for a sign-in link with it, and opening that first link creates the admin account. A password sign-up with that address is refused. Everyone else signs up as a student, and the admin changes roles at `/admin/users`.

Back up the database before every migration. See `docs/RUNBOOK.md`, step 0.7.

After changing `prisma/schema.prisma`: `pnpm prisma migrate dev --name <what-changed>`, then `pnpm prisma generate` so the client in `src/generated/` matches.

## Test

```
pnpm test          # unit tests, Vitest, no database needed
pnpm lint
pnpm typecheck
pnpm test:e2e      # browser tests, Playwright; needs the compose services running
```

`pnpm test:watch` keeps Vitest running while you work. The browser tests start their own copy of the app on port 3100, sign up throwaway accounts ending in `@e2e.test`, read magic links from Mailpit, and delete those accounts when they finish. First time only: `pnpm playwright install chromium`.

## Where things are

- `docs/PRD.md`: what and why. `docs/ARCHITECTURE.md`: how. `docs/DECISIONS.md`: what was decided and why.
- `docs/RUNBOOK.md`: what to do next. `docs/tasks/`: one file per task.
- `src/app/`: pages and server actions. `src/lib/`: pure functions and data access. `prisma/`: schema and migrations. `e2e/`: browser tests.
- `src/auth.ts` and `src/auth.config.ts`: Auth.js. `src/proxy.ts`: the route guard, driven by the role matrix in `src/lib/access.ts`.
