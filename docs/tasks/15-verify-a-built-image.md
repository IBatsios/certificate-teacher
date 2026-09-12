<!-- Hand-written for v2. Not generated from docs/intake.md; do not run /kickoff over it. -->

# 15: Verify a built image

**What to build:** "As a student, I can submit what I built for checking, so that the app confirms I applied the Docker lessons correctly." The Docker course's equivalent of Task 05. From the user's side: the student pastes the output of `docker image inspect` and `docker inspect`, and the app shows what it found and a verdict, with what to fix when something is off.

**Blocked by:** 13, 14.

**Status:** not started.

## What is checked

Written down once, in `DOCKER_CHECKS` in `src/lib/docker-image.ts`, and rendered by the page from that list, so the lesson and the checker cannot drift apart. This is the shape `CERTIFICATE_CHECKS` established in Task 05 and it is the right one.

| Key | What it looks at |
|---|---|
| `carries-your-token` | `Config.Labels["teacher.challenge"]` is this session's token |
| `has-a-real-tag` | `RepoTags` names a version, not only `latest` |
| `small-enough` | `Size` is under the figure the lesson quotes, which a multi-stage build achieves and a single-stage one does not |
| `runs-as-non-root` | `Config.User` is set and is not `root` or `0` |
| `has-a-healthcheck` | `Config.Healthcheck.Test` is present |
| `port-is-published` | The container's `NetworkSettings.Ports` maps the port to the host |
| `nothing-secret-baked-in` | No name in `Config.Env` matching PASSWORD, SECRET, KEY, or TOKEN |

## Steps, a vertical slice in this order

1. **Back up the database** per RUNBOOK 0.7. This is v2's second and last migration.
2. Data access: `src/lib/docker-image.ts` with pure `parseInspect` and `checkImage`, tested first against fixtures under `src/lib/__fixtures__/`: a good pair, a single-stage image that is too large, one running as root, one with no health check, one with a token from another session, and one carrying a secret-looking environment variable.
3. Schema: `ImageSubmission` belonging to `LearningSession`, holding the extracted fields (image tag, size, user, whether a health check is present, the published ports), the verdict, and the failed check keys. **Not the raw JSON.** Then `pnpm prisma migrate dev --name image-submission`.
4. Interface: a server action and a page at `/lessons/docker/verify`, following D32 and D56 as Task 05 did.
5. Walk the story as the student would, with a real image built by following Task 13 and Task 14.
6. End-to-end test at `e2e/verify-an-image.spec.ts`.

## Acceptance criteria

- [ ] As a student, I can submit my inspect output and see it checked, with a verdict and what to fix.
- [ ] The raw inspect JSON is never stored. Only the extracted fields and the failed check keys are written.
- [ ] A submission containing anything key-shaped is refused on the raw text before parsing, and never stored, as in D55.
- [ ] A token from another session fails `carries-your-token` and says so in words a student can act on.
- [ ] Vitest covers the parse and check functions and the data-access functions as a caller would observe them, and passes.
- [ ] The end-to-end test passes: `e2e/verify-an-image.spec.ts`.
- [ ] The migration is committed under `prisma/migrations/`. The database was backed up first, in development and in production.
- [ ] The size threshold in `DOCKER_CHECKS` and the figure quoted in the Task 13 lesson text are the same number, and a test asserts it.
- [ ] Every earlier test still passes locally. CI green on the pull request.

## Suggested skills

- `tdd`: pure functions with fixtures, exactly as Task 05 was built.
- `security-scan` and `error-handling`: this route accepts a file from a stranger.
- `api-design`: the size limit and its message.

## Notes

**Store the extracted fields, not the input.** This is a deliberate difference from `CertificateSubmission`, which keeps the PEM because a certificate is public by nature. `docker inspect` output is not: it carries `Config.Env`, which on a student's own machine can hold real credentials they put there for something unrelated. Keeping the raw JSON would turn this feature into a credential collection. Record the difference as a decision.

`docker image inspect` output is larger than a PEM. A cap well above a realistic pair of documents, around 256 KB, is right; `MAX_CERTIFICATE_BYTES` at 16 KB is not.

**Be honest about what this proves.** The certificate check is real verification: a signature cannot be forged without the root's private key. This one is not. JSON can be typed by hand, and a determined student can pass every check without building anything. The token stops one student pasting another's work, and that is the limit of it. Write that into the decision record so that nobody later mistakes this for proof, and do not add anti-cheat machinery chasing a threat this app does not have.
