<!-- Hand-written for v2. Not generated from docs/intake.md; do not run /kickoff over it. -->

# 13: Docker lesson 2 — build your own image

**What to build:** "As a student, I can build my own image from a Dockerfile, so that I have made the thing I have so far only downloaded." The second lesson of the Docker course, at `content/lessons/build-an-image/`. From the user's side: they write a Dockerfile, build a small website image with their own name on the page, watch the layer cache work, tag it, and shrink it with a multi-stage build.

**Blocked by:** 12.

**Status:** built on `feature/docker-lesson-build`, pull request #27 open.

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
3. Content: `content/lessons/build-an-image/`, six step files, `lesson.md`, `finished.md`. Also `content/lessons/containers/finished.md`: its last sentence says lesson 2 is being written, because a link to it would have been a 404 (D73). Make that sentence the link to this lesson.
4. Catalog: add `build-an-image` to the Docker course's lessons.
5. Walk every command in **PowerShell and in Terminal**, on a machine with no build cache, and record the real image sizes into the lesson text.
6. End-to-end test at `e2e/docker-build.spec.ts`, including that the token shown is stable across a reload and changes after a start-over.

## Acceptance criteria

- [x] As a student, I can follow the lesson and end with a tagged image of my own that serves a page with my name on it. Walked start to finish on 2026-09-13 in PowerShell 7 and in Git Bash: `my-site:3`, two stages, labelled, served the page with the name on it on port 8088, and `my-site:latest` was moved onto it.
- [x] The challenge token is stable within a session, different for a different student, and different after a start-over. `src/lib/challenge-token.test.ts` covers the derivation; the first journey in `e2e/docker-build.spec.ts` reads the token off the page, reloads, signs out and in, and starts over; the second signs up a second student.
- [x] The token is never written to the database and never appears in a log. It is computed on the lesson page from the session id and handed to the markdown renderer; nothing in the diff stores or logs it, and the security review below confirmed it (build notes).
- [x] The image sizes quoted in the lesson are the sizes a person actually measured, not estimates. Docker Desktop 29.7.2 on 2026-09-13: `394MB` disk usage and `80.4MB` content size single-stage, `102MB` and `28.8MB` two-stage, `103MB` and `29.7MB` for `nginx:alpine` alone.
- [ ] Every command has been run by a person in both PowerShell and Terminal. Every fence was run in PowerShell 7 and in Git Bash on Windows, in the lesson's order, with the lesson's exact file contents; the `.dockerignore` command and the `--format` quoting were also run in Windows PowerShell 5.1; every output the lesson quotes is what those runs printed (build notes). Still wanting a person: the same walk in Terminal on a Mac, with a browser open for the three "open <http://localhost:8088>" moments, which were checked here with `curl`.
- [x] The end-to-end test passes: `e2e/docker-build.spec.ts`.
- [x] Every earlier test still passes locally: 240 unit tests and 48 Playwright journeys (45 plus the three new ones) on 2026-09-13. CI green on pull request #27 (both jobs, on the feature commit and on the docs commit).
- [x] Any new environment variable is in `.env.example` with a placeholder. `CHALLENGE_TOKEN_KEY`, with a comment saying what changing it does to students mid-course.

## Suggested skills

- `tdd`: the token derivation is a pure function; write it first.
- `security-scan`: the token's key is a secret and belongs in the environment, not in code.
- `error-handling`: a build that fails is the most likely place in the whole course for a student to give up. Every failure the lesson can anticipate gets a sentence.

## Notes

Step 3 is not filler. The student's `my-certs` folder holds `localhost.key`, and `COPY . .` from the wrong working directory would bake a private key into an image. The certificates course refuses to store a private key (D55); this lesson teaches the same care on their own machine, and it is the most valuable paragraph in the lesson.

The token being derived rather than stored is what keeps this from needing a migration. Do not be tempted into a `ChallengeToken` table.

## Build notes

- The step keys are `dockerfile`, `layers`, `dockerignore`, `tags`, `smaller`,
  and `sign`. They are stored against student sessions from the first merge
  on; never rename one.
- The lesson's build-time tool is Alpine's `pandoc-cli`: the student writes
  the page in Markdown, as the lessons themselves are written, and pandoc
  turns it into HTML during the build. It was chosen for its weight. A
  multi-stage build only teaches when the tool left behind is big enough to
  see, and pandoc is 230 MB installed, so the single-stage image is 80.4 MB
  to download and 394 MB on disk against 28.8 MB and 102 MB for the
  two-stage one. Step 1 deliberately puts `COPY` before the install so that
  step 2 can make the student feel the cache rule before stating it: a page
  edit costs fifteen seconds in the wrong order and two in the right one.
- The lesson publishes on port 8088, not 8080, and versions run `my-site:1`
  to `my-site:3`. 8080 was already held on the machine this was written on,
  by a process that is not Docker, so `docker run -p 8080:80` succeeded and
  the browser reached the other program; that is the most common way this
  step fails for a student too, and step 1 has a sentence for it. Task 14's
  spec has been edited to follow: `-p 8088:80` and `my-site:4`.
- Three things Docker 29 does that the plan did not expect. Its containerd
  image store gives every build its own image ID even when nothing changed,
  so "two names, one image" is demonstrated with `docker tag`, not a
  rebuild. Rebuilding a tag leaves no `<none>` rows behind on that store, so
  the lesson does not mention dangling images. And `docker image ls` reports
  `DISK USAGE` and `CONTENT SIZE`, and `docker image inspect`'s `Size` is the
  content size (`80422327` and `28783758` bytes here), where the classic
  store reports uncompressed sizes; the 50 MB the lesson quotes for Task 15
  is a content size, and the classic store's inspect output has
  `GraphDriver` filled in where the containerd store's is `null`, which is
  how Task 15 can tell them apart (D74).
- The walk was scripted so that both shells ran the same commands with the
  same files in the same order (`walk-ps.ps1` and `walk-bash.sh`, kept out
  of the repository), with `--no-cache` on the first build standing in for a
  fresh machine, because the build cache on the machine used belongs to other
  projects and was not pruned. Two moments the lesson says "the install runs
  once more", after the reorder in step 2 and in the new stage in step 5,
  showed `CACHED` on this machine because an earlier exploratory walk had
  already built those exact steps; the exploratory walk's own timings, 15
  seconds and 6 seconds against 2 seconds cached, are the evidence they run
  on a machine that has not.
- BuildKit was captured in its plain progress layout (`#7 CACHED`), which is
  what a non-terminal gets. The lesson quotes the terminal layout
  (`=> CACHED [3/4] ...`) that a student sees, with the same steps in the
  same order.
- Git Bash on Windows rewrites any docker argument beginning with a slash
  into a Windows path (`ls /site` becomes `ls C:/Program Files/Git/site`),
  which breaks three commands in steps 3 and 5. Step 3 has a sentence for
  it, with `//site` as the fix; the Git Bash walk used it. Terminal on a Mac
  or Linux is unaffected.
- `.dockerignore` is made from the terminal, in a `powershell` fence and a
  `bash` fence, because TextEdit refuses to save a name that begins with a
  dot. The fences say the same thing in the two shells' own words, which is
  why they are not one `shell` fence.
- Two code changes in a content task, beyond the token. A `file` fence
  language in `code-block.tsx`, labelled "The whole file, exactly as
  written", with a copy button, for the six files the student creates or
  replaces; the deploy lesson's file fences predate it and still use `text`
  and `yaml`. And `{{challenge-token}}` in a step body is filled by the
  lesson page before rendering (`src/lib/lesson-placeholders.ts`), so the
  token sits inside the Dockerfile the student copies; the regex needs a
  plain lowercase name, so the `{{json .Config.Labels}}` in step 6's
  `docker image inspect` command is not taken for one, and a test says so.
- `containers/finished.md` now links to this lesson, as D73 said it would.
  The containers journey follows the link; its "no link" assertion is gone.
- The journey reads the token off the signing step with a regex for its
  shape and requires every appearance in the step to agree, so a token that
  differed between the sentence and the Dockerfile would fail it.
- The security review (security-reviewer agent, 2026-09-13) found no issue
  above LOW: the derivation is a keyed hash with domain separation, 64 bits
  is adequate for the stated threat, the page is a server component and the
  only client component is the copy button, nothing logs or stores the
  token, and no real key is in the diff. Its one note worth keeping: if a
  route is ever added that lets a token be tried repeatedly, revisit the
  truncation length.
