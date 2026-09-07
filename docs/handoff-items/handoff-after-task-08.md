# Handoff — after Task 08, deploy to Railway

**Date:** 2026-09-06
**Phase finished:** Task 08: Teacher is live at https://teacher.ioannisbatsios.com, migrations run before every release, and the most important path works on the live site
**Next phase:** Task 04 (deploy lesson) or Task 05 (verify an upload), both on the frontier; Task 06 and 07 follow them

## Where things stand

- Live at https://teacher.ioannisbatsios.com behind Cloudflare, on Railway project `teacher`, service `certificate-teacher`, with a Postgres service. Railway deploys `main` (D41); the service's start command, pre-deploy migration, and health check are set on the service itself, and `.railway/railway.ts` describes the project in Railway's infrastructure-as-code format (D48). `railway config plan` reports no drift.
- Only Cloudflare can reach the app: a transform rule adds the `X-Origin-Secret` header and the app refuses requests without it, except the home page for Railway's health check (D44). A request straight to Railway's edge is refused.
- Sign-in is rate limited in memory with a hard key cap (D39), every response carries the security headers, and pages carry a nonce-based content security policy (D45). Both verified on the live site.
- Email goes through Resend over SMTP from `teacher@send.ioannisbatsios.com` (D42). The admin account exists: the owner signed in with a magic link on 2026-09-06.
- The live walk on 2026-09-06 passed: sign-up, a lesson tick, the test recording a pass, sign-out, sign-in with progress intact, no console errors or failed responses. Two throwaway student accounts from the walks remain in production, both ending in `@e2e.test`; harmless, and the admin can see them on `/admin/users`.
- Decisions D39 to D50 in `docs/DECISIONS.md`. The README's Deploy section is the procedure.

## Things the next session should know

- **Merges to `main` did not deploy on their own during Task 08.** The service's source carried a commit pin from when it was created in the dashboard, and `railway environment edit` did not clear it. Every deploy so far was triggered with `railway redeploy --service certificate-teacher --from-source --yes`, which pulls the latest `main`. Until a merge is seen to deploy by itself, run that after merging, then `railway deployment list --service certificate-teacher --limit 1 --json` until it reads SUCCESS. If it never starts deploying on its own, reconnect the repository from the service's Settings in the dashboard.
- **Railway ignores `railway.json` for services created after mid-2026.** The first deploy ran without any of its settings and passed only because nothing checked it. Service settings live on the service now; `railway.json` is gone (D48).
- **`railway config plan` on Windows** needs `$env:_` set to the path of `railway.exe` (under the npm global folder, `@railway/cli/bin`) before it runs, or the SDK reports the CLI as too old. Run it from PowerShell.
- **Cloudflare must not rewrite the page.** Email Address Obfuscation injected a script and altered every email address in the HTML, which broke React's hydration and tripped the content security policy. A configuration rule for the hostname turns it and Rocket Loader off (D50). If a new Cloudflare feature is switched on for the zone, check the browser console on the lesson page.
- **The proxy never writes the session cookie.** Auth.js's `auth()` wrapper re-issued it on every response, and a request in flight with the old cookie could restore a session after sign-out; seen live. `src/proxy.ts` uses `getToken`, read-only (D49). Do not put the wrapper back.
- **The Postgres password was printed into a tool output once**, during variable setup in this session. The database is only reachable inside Railway's private network. Rotate it when convenient: change `POSTGRES_PASSWORD` on the Postgres service, let it redeploy, then redeploy the app so the reference resolves again.
- **Backups.** The runbook's rule holds: before merging a migration, take a backup in the dashboard (Postgres service, Backups) or with the `pg_dump` command in the README. Confirm the daily schedule is set on the Postgres service; it was left as a dashboard step for the owner.
- **Two variables hold secrets only the owner has:** `EMAIL_SERVER` (the Resend key) and `ORIGIN_SECRET` (also in the Cloudflare transform rule). Changing `ORIGIN_SECRET` means changing both places.
- **Git Bash and Docker paths.** From Git Bash, prefix container paths with `MSYS_NO_PATHCONV=1` or the backup command fails; the runbook's wording belongs in the intake.
- Task 02 and 03 notes still hold: Mailpit on 8026, the dev server on 3001, the browser tests on 3100 with their own origin secret, the admin created only by magic link, step keys are forever.

## What to do next, in order

1. Pick the next task from the frontier: Task 04 continues the lesson with the deploy steps and reuses the certificates lesson's pieces; Task 05 verifies an uploaded certificate with `@peculiar/x509`. Both start from `main` on a branch and end in a pull request; after the merge, trigger the deploy as described above and watch it.
2. `/project-init` (runbook 0.5) is still not run.
3. When a phase ends, write the next handoff doc here, in this shape.

## Suggested skills for the next session

- `plan` and `tdd`: at the start of the next task.
- `use-railway`: for anything on the platform; it knows the CLI and the API.
- `security-scan`: before each pull request now that the site is public.
- The full list, with when to use each, is in `CLAUDE.md`.
