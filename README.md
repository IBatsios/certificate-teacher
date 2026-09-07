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
pnpm test          # Vitest: pure functions, plus the session functions against the compose database
pnpm lint
pnpm typecheck
pnpm test:e2e      # browser tests, Playwright; needs the compose services running
```

`pnpm test:watch` keeps Vitest running while you work. The session tests create accounts ending in `@unit.test` and remove them afterwards. The browser tests start their own copy of the app on port 3100, sign up throwaway accounts ending in `@e2e.test`, read magic links from Mailpit, and delete those accounts when they finish. First time only: `pnpm playwright install chromium`.

## Deploy

The app runs on Railway at https://teacher.ioannisbatsios.com from the `main` branch. The service is set to build with Railpack, start with `pnpm start`, run `pnpm prisma migrate deploy` as the pre-deploy command before the new version takes traffic, and treat the home page as the health check. `.railway/railway.ts` describes the whole project in Railway's infrastructure-as-code format; `railway config plan` shows any drift between it and Railway, and `railway config apply` pushes the file's version, so run apply only on purpose. On Windows the plan command needs `$env:_` set to the path of `railway.exe` first (see D48).

### Every deploy

Merge to `main`. Railway builds, runs the migrations, waits for the health check, then switches traffic. Watch it in the dashboard or with `railway logs`. If something fails, the previous version keeps serving; roll back from the Deployments tab.

From a terminal instead, on a checkout of `main`: `railway up`.

### Before merging a migration

Take a backup first. In the Railway dashboard, open the Postgres service, Backups tab, and create one. Or from a terminal with Docker running:

```
railway variables --service Postgres --kv | grep DATABASE_PUBLIC_URL
docker run --rm postgres:16 pg_dump "<that url>" > "backup-$(date +%Y-%m-%d)-production.sql"
```

A daily backup schedule is also set on the Postgres service; it keeps six days.

### One-time setup

Done once on 2026-09-06; here so it can be rebuilt.

1. Railway project `teacher` with two services: Postgres, and the app connected to this GitHub repository on branch `main` so merges deploy. The service settings above were applied with `railway environment edit`; a `railway.json` in the repo is ignored for services created after mid-2026.
2. Variables on the app service, each one from `.env.example`: `DATABASE_URL` as a reference to the Postgres service's own variable, a fresh `AUTH_SECRET` from `openssl rand -base64 32`, `AUTH_URL=https://teacher.ioannisbatsios.com`, `AUTH_TRUST_HOST=true`, `ORIGIN_SECRET` from `openssl rand -base64 32`, `EMAIL_SERVER` and `EMAIL_FROM` for the SMTP service, and `ADMIN_EMAIL`. The app refuses to start when `AUTH_TRUST_HOST` is set without `AUTH_URL` and `ORIGIN_SECRET`. Node 22 comes from `.node-version`. Never set `RAILPACK_PRUNE_DEPS`: the pre-deploy command needs the Prisma CLI, which is a dev dependency.
3. Custom domain `teacher.ioannisbatsios.com` on the app service. At Cloudflare: the CNAME and the TXT record Railway shows, both proxied, and the zone's SSL/TLS mode set to Full (not Full strict, which Railway does not support).
4. At Cloudflare, a transform rule (Rules, Transform Rules, Modify Request Header) for hostname `teacher.ioannisbatsios.com` that sets the request header `X-Origin-Secret` to the value of `ORIGIN_SECRET`. Only requests carrying it get past the app, so traffic cannot skip Cloudflare; the home page stays open for Railway's health check. Remove the `*.up.railway.app` domain from the service so it is not advertised.
5. At Cloudflare, a configuration rule (Rules, Configuration Rules) for hostname `teacher.ioannisbatsios.com` that turns off Email Address Obfuscation and Rocket Loader. Both rewrite the page's HTML, which breaks React's hydration and trips the content security policy (D50).
6. Email: an SMTP service with a verified sending domain, so magic links arrive. Resend's SMTP endpoint is `smtp://resend:<api key>@smtp.resend.com:465`.
7. The daily backup schedule on the Postgres service.
8. The app keeps sign-in limits in memory, which is right for one instance. If the service is ever scaled to several, move them to a shared store first (D39).

## Where things are

- `docs/PRD.md`: what and why. `docs/ARCHITECTURE.md`: how. `docs/DECISIONS.md`: what was decided and why.
- `docs/RUNBOOK.md`: what to do next. `docs/tasks/`: one file per task.
- `src/app/`: pages and server actions. `src/lib/`: pure functions and data access. `prisma/`: schema and migrations. `e2e/`: browser tests.
- `content/lessons/`: the lesson text, one markdown file per step. Edit the text there; the page renders it. A step's `key` is stored with students' progress, so never change one.
- `src/auth.ts` and `src/auth.config.ts`: Auth.js. `src/proxy.ts`: the route guard, driven by the role matrix in `src/lib/access.ts`.
