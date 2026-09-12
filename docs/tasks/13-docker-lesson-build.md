<!-- Hand-written for v2. Not generated from docs/intake.md; do not run /kickoff over it. -->

# 13: Docker lesson 2 — build your own image

**What to build:** "As a student, I can build my own image from a Dockerfile, so that I have made the thing I have so far only downloaded." The second lesson of the Docker course, at `content/lessons/build-an-image/`. From the user's side: they write a Dockerfile, build a small website image with their own name on the page, watch the layer cache work, tag it, and shrink it with a multi-stage build.

**Blocked by:** 12.

**Status:** not started.

## Steps of the lesson, in order

1. **A Dockerfile is a recipe.** `FROM`, `COPY`, `RUN`, `EXPOSE`, `CMD`, one line at a time, in a `my-site` folder next to `my-certs`. Build it: `docker build -t my-site:1 .`. Run it. Open it. It is their page.
2. **Every line is a layer.** Build it again unchanged and watch every step say `CACHED`. Change the HTML, build again, and watch only the steps after the change re-run. Then the rule that follows from it: put the things that change least at the top.
3. **`.dockerignore`.** What got copied in that should not have. `my-certs` is next door and holds a private key; this is the lesson where that matters.
4. **Tags.** `docker build -t my-site:2 .`, `docker image ls`, and what `latest` really is: a default tag, not a promise about anything.
5. **Make it smaller.** A multi-stage build: one stage to assemble, a second that copies only the result onto a small base. Compare `docker image ls` before and after, with the two numbers side by side in the lesson text.
6. **Sign your work.** The app shows a token for this session. Add it as `LABEL teacher.challenge="..."`, rebuild, and confirm it is there with `docker image inspect`. Task 15 asks for this.

## Steps, a vertical slice in this order

1. Data access: the per-session challenge token. Derive it rather than store it: a keyed hash of the learning session id, in `src/lib/challenge-token.ts`, pure and tested first. Nothing new in the schema, and a token cannot outlive the session it belongs to or be guessed from another student's.
2. Interface: the token is shown in step 6 of the lesson, with a copy button. The existing `src/app/lessons/copy-button.tsx` already does this.
3. Content: `content/lessons/build-an-image/`, six step files, `lesson.md`, `finished.md`.
4. Catalog: add `build-an-image` to the Docker course's lessons.
5. Walk every command in **PowerShell and in Terminal**, on a machine with no build cache, and record the real image sizes into the lesson text.
6. End-to-end test at `e2e/docker-build.spec.ts`, including that the token shown is stable across a reload and changes after a start-over.

## Acceptance criteria

- [ ] As a student, I can follow the lesson and end with a tagged image of my own that serves a page with my name on it.
- [ ] The challenge token is stable within a session, different for a different student, and different after a start-over. Covered by unit tests and end to end.
- [ ] The token is never written to the database and never appears in a log.
- [ ] The image sizes quoted in the lesson are the sizes a person actually measured, not estimates.
- [ ] Every command has been run by a person in both PowerShell and Terminal.
- [ ] The end-to-end test passes: `e2e/docker-build.spec.ts`.
- [ ] Every earlier test still passes locally. CI green on the pull request.
- [ ] Any new environment variable is in `.env.example` with a placeholder. The token's key is one.

## Suggested skills

- `tdd`: the token derivation is a pure function; write it first.
- `security-scan`: the token's key is a secret and belongs in the environment, not in code.
- `error-handling`: a build that fails is the most likely place in the whole course for a student to give up. Every failure the lesson can anticipate gets a sentence.

## Notes

Step 3 is not filler. The student's `my-certs` folder holds `localhost.key`, and `COPY . .` from the wrong working directory would bake a private key into an image. The certificates course refuses to store a private key (D55); this lesson teaches the same care on their own machine, and it is the most valuable paragraph in the lesson.

The token being derived rather than stored is what keeps this from needing a migration. Do not be tempted into a `ChallengeToken` table.
