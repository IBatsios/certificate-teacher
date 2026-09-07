<!-- Generated from docs/intake.md by kickoff v0.1.0. Edit the intake, not this file. -->

# 08: Deploy to Railway

**What to build:** The app runs at ioannisbatsios.com from the default branch, migrations run on every release, and a second deploy is one command or one merge.

**Blocked by:** 01, 02.

**Status:** in progress on `feature/deploy-railway` since 2026-09-06.

## Steps, in order

1. `railway init` in this directory; accept the generated config. Human step: needs the account. Add a PostgreSQL service to the project in the Railway dashboard.
2. Set every variable from `.env.example` with `railway variables`, with a production `DATABASE_URL` from the Railway PostgreSQL service, never the development one.
3. Add `prisma migrate deploy` as the release command.
4. Add `ioannisbatsios.com` as a custom domain on the service in the Railway dashboard and create the DNS record it shows you.
5. Deploy and walk "It must confirm their knowledge that they were able to apply and deploy; include a test phase they have to complete to pass" on the live URL.
6. Write the deploy procedure into `README.md`.

## Acceptance criteria

- [ ] Reachable at https://ioannisbatsios.com.
- [ ] "It must confirm their knowledge that they were able to apply and deploy; include a test phase they have to complete to pass" works on the live URL.
- [x] `prisma migrate deploy` runs on every release before traffic is served. (Railway's pre-deploy command on the service; deployment 74ddc010 on 2026-09-06 ran it before the health check.)
- [x] No secret is in the repository; every one is in Railway's variables. (gitleaks clean; variables set on the service on 2026-09-06.)
- [x] A deploy from the default branch is repeatable, and `README.md` says how. (GitHub connection on `main`, or `railway redeploy --from-source`; README, Deploy.)
- [x] A backup step precedes the migration in the release procedure. (README, Before merging a migration; daily schedule on the Postgres service.)

## Suggested skills

- `verification-loop`: before calling the first deploy done.
- `security-scan`: the last scan before the site is public.
