# teacher

Teacher is an app that teaches how certificate chains work, how to get https in your browser, how to import certificates into a Java keystore (and why), and how to set up a reverse proxy. Students prove they can apply it by passing a test; an admin sees everyone's progress and results.

## Run it

You need Node 22 or newer, pnpm 10, and Docker Desktop.

```
docker compose up -d        # PostgreSQL 16 on localhost:5432, development only
cp .env.example .env        # then fill in every value
pnpm install                # also generates the Prisma client
pnpm prisma migrate dev     # applies the migrations to the development database
pnpm dev                    # http://localhost:3000
```

Back up the database before every migration. See `docs/RUNBOOK.md`, step 0.7.

After changing `prisma/schema.prisma`: `pnpm prisma migrate dev --name <what-changed>`, then `pnpm prisma generate` so the client in `src/generated/` matches.

## Test

```
pnpm test          # unit tests, Vitest, no database needed
pnpm lint
pnpm typecheck
```

`pnpm test:watch` keeps Vitest running while you work.

## Where things are

- `docs/PRD.md`: what and why. `docs/ARCHITECTURE.md`: how. `docs/DECISIONS.md`: what was decided and why.
- `docs/RUNBOOK.md`: what to do next. `docs/tasks/`: one file per task.
- `src/app/`: pages and server actions. `src/lib/`: pure functions and data access. `prisma/`: schema and migrations.
