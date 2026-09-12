# Plan — the Docker course (v2)

**Date:** 2026-09-12
**Phase finished:** planning for v2. No code has changed.
**Next phase:** Phase 2 of `docs/RUNBOOK.md`, starting at Task 10.

## What changed, and why

The coming course was Kubernetes (D65). It is Docker instead.

The reason is in `content/lessons/deploy/01-start-the-site.md`. That lesson
already hands a reader with no technical experience a tool and asks them to
trust it:

> You will use **Docker**, which runs small pre-packaged programs without
> installing them properly. One command starts the whole website.

It then has them write `image:`, `ports:`, `volumes:`, and
`proxy_pass http://backend:80`, and explains none of it. A Docker course is
therefore not a new subject; it is the explanation of something the student
has already done successfully, which is a much better place for a second
course to start than a cluster they have never seen. It also ends somewhere
Kubernetes could not: with their own built image behind the nginx proxy from
the certificates course, on https, on a certificate they signed themselves.
The two courses join up.

## The sandbox question

The online Docker sandbox worth remembering was **Play with Docker**, and it
was **discontinued on 1 March 2026**. It is gone.

Docker's own announcement points at [iximiuz
Labs](https://labs.iximiuz.com/playgrounds/docker), Google Cloud Shell, and a
"Labspaces" Docker Desktop extension. [Killercoda](https://killercoda.com/docker)
is the other live option: free tier, one-hour sessions, Docker playground,
custom scenarios from a Git repository.

**The decision is to link a sandbox as an escape hatch, not to build on one.**

- Docker Desktop is already a student prerequisite (D51) and the Windows path
  is already proven.
- Every sandbox is account-gated and time-limited, and Play with Docker has
  just demonstrated what depending on one is worth.
- The point of Teacher is that the student built it on their own machine.

So: one panel in Task 12's first step, for a student on a locked-down work
laptop, naming the time limit. The sandbox path stays compatible with the
check in Task 15, because a browser terminal can copy `docker inspect` output
out perfectly well.

Source: [Docker forums, the deprecation
announcement](https://forums.docker.com/t/play-with-docker-is-deprecated-and-will-be-unavailable-starting-march-1-2026-learn-about-alternatives/151177).

## Two decisions taken

**1. Do the multi-course work properly, rather than bolting a second course
onto the single-course machinery.** Tasks 10 and 11. The bolt-on would have
saved roughly a third of the effort and permanently cost: a start-over on one
course archiving the other, five near-identical lesson page directories, and
an admin report that cannot say which course a student is stuck in. D65 was
written "preparing for a second course", and this is what that preparation was
for.

**2. Docker is listed second, after the certificates course**, and opens by
telling the student they have already used it. Listing it first is arguably
more logical, since the deploy lesson uses Docker unexplained, but the
certificates course is the finished and proven one, the success signal is
written against it, and reversing the order is a larger content edit than it
looks.

## Where the effort actually is

Not in the Docker content. Tasks 10 and 11 are refactors of working, deployed,
tested code, and they are the schedule risk. Single-course assumptions are
load-bearing in `lesson-routes.ts`, `lesson-progress.ts`, `learning-session.ts`,
`admin-report.ts`, both lesson page directories, the schema, and the one
`content/test/questions.json`.

The 151 unit tests and 35 Playwright journeys are the safety net for that work,
and in Task 11 they are the acceptance criterion outright: a journey that needs
editing to pass means the refactor changed behaviour.

## Risks worth carrying forward

- **Two migrations, no staging.** Task 10 and Task 15. Back up first, both in
  development and in production, per RUNBOOK 0.7. Task 10's is the harder one:
  a non-null column on a populated table needs its backfill written by hand.
- **Lesson content written but never run.** This is the repeated bug in this
  repository's history. Task 04 shipped a Java command that worked in Git Bash
  and failed in PowerShell. Every `shell` fence gets run in PowerShell and in
  Terminal before merge, by a person.
- **Multi-arch base images only.** `alpine`, `nginx:alpine`, `node:*-alpine`.
  An amd64-only image warns and crawls under emulation on Apple Silicon, and a
  student with no technical experience reads that warning as having broken
  something.
- **Docker Hub anonymous pull limits** bite a room of people behind one office
  address. Called out in Task 12.
- **The image check is not real verification.** The certificate check is: a
  signature cannot be forged without the root's key. `docker inspect` output
  can be typed by hand. The per-session token stops one student pasting
  another's work and that is its limit. Task 15 says so, and says not to build
  anti-cheat machinery for a threat this app does not have.

## Still open from v1

Three of the four items in `handoff-after-v1.md` are folded into this phase or
are unaffected. The one that is not:

- **`sign-in-limits.ts` still has the untested `a && b` shape** that Task 05
  proved was a real bug in `certificate-limits.ts`. Task 16 names it. Either do
  it there or write it forward deliberately rather than losing it.

The first item — walking the Mac Keychain, Firefox, and fresh-Docker-install
paths on a machine that is not this one — remains the highest-value thing that
needs a person, and v2 does not do it.
