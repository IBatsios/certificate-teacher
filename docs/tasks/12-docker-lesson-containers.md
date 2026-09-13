<!-- Hand-written for v2. Not generated from docs/intake.md; do not run /kickoff over it. -->

# 12: Docker lesson 1 — what a container actually is

**What to build:** "As a student, I can learn what a container is by running one, so that the Docker I already used in the deploy lesson stops being magic." The first lesson of the Docker course, at `content/lessons/containers/`. From the user's side: they run their first container, look inside it, then re-read the `docker-compose.yml` they wrote in the certificates course and find that they can now read every line of it.

**Blocked by:** 10, 11.

**Status:** built on `feature/docker-lesson-containers`, pull request #26 open.

## The hook

`content/lessons/deploy/01-start-the-site.md` says, to a reader with no technical experience:

> You will use **Docker**, which runs small pre-packaged programs without installing them properly. One command starts the whole website.

Then it has them write `image:`, `ports:`, `volumes:`, and `proxy_pass http://backend:80`, and explains none of it. This lesson is the explanation of something the student has already done successfully. Open on that, by name.

## Steps of the lesson, in order

1. **Run one.** `docker run hello-world`, then read what actually happened: a thing was downloaded, started, printed, and stopped.
2. **Get inside one.** `docker run -it alpine sh`. Look around: `ls /`, `ps`. It has its own filesystem and its own process list, and neither is the computer's. Exit, and notice it is gone.
3. **Image and container are different words.** `docker image ls` and `docker ps -a` side by side. An image is the thing you downloaded; a container is one run of it. Run `alpine` twice and see two containers from one image.
4. **Read the file you already wrote.** Go back to `my-certs/docker-compose.yml` from the deploy lesson. `image: nginx:alpine` is an image, like the `alpine` above. `traefik/whoami` is an image. The `8443:443` and the `:ro` lines are the next two lessons. Nothing in it is new any more.
5. **Clean up.** `docker ps -a`, `docker rm`, `docker image ls`, `docker image rm`, and why a disk fills up if you never do this.

## Steps, a vertical slice in this order

1. Content: `content/lessons/containers/lesson.md`, five step files, and `finished.md` pointing at lesson 2. No code should be needed: Tasks 10 and 11 exist so that a lesson is a folder.
2. Catalog: the Docker course becomes `available` with `containers` as its first lesson. It stays available from here on, with lessons 2 and 3 added as they land.
3. The sandbox panel, in step 1 of the lesson: what to do if Docker Desktop cannot be installed on this machine. Name the time limit. Name that the rest of the course, including the check in Task 15, still works from a browser terminal.
4. The Docker Hub note, also in step 1: anonymous pulls are rate-limited per address, which bites a room of people on one office connection. Signing in to Docker Hub raises it.
5. Walk every command in **PowerShell and in Terminal** before merging.
6. End-to-end test at `e2e/docker-containers.spec.ts`: the lesson opens, steps tick, progress survives a reload, start-over does not touch the certificates course.

## Acceptance criteria

- [x] As a student, I can open the Docker course from the home page, work through lesson 1, and have every tick saved between visits. The first journey in `e2e/docker-containers.spec.ts` does exactly that, with a reload after the first tick and a sign-out and sign-in after the last.
- [x] Starting over on the Docker course leaves certificate progress untouched, and the reverse. Covered end to end, in both directions, in the second journey of the same spec.
- [ ] Every command in the lesson has been run by a person, in both PowerShell and Terminal, and the output matches what the lesson says it will be. Every `shell` fence was run in PowerShell 7 and in Git Bash on Windows against Docker Desktop 29.7.2 on 2026-09-13, and every output the lesson quotes is what those runs printed (build notes). Still wanting a person: the same walk in Terminal on a Mac, and the interactive `docker run -it alpine sh` session in a real console, which was checked with `-i` and piped input instead because the tool that ran the walk has no terminal.
- [x] The sandbox fallback links resolve and the lesson states the session time limit. Both playground links, Docker's limits page, Docker Desktop, and Docker Hub all answered 200 on 2026-09-13; the limits quoted are from each site's own FAQ or pricing page on that day; the journey asserts the lesson says "one hour".
- [x] The end-to-end test passes: `e2e/docker-containers.spec.ts`.
- [ ] Every earlier test still passes locally: 218 unit tests and 45 Playwright journeys (43 plus the two new ones) on 2026-09-13. CI green on the pull request.

## Suggested skills

- `frontend-design-direction`, `make-interfaces-feel-better`, `front-a11y`: this is the first screen of a new course.
- `e2e-testing`: the journey, and the cross-course isolation assertion.
- `error-handling`: every "if this goes wrong" branch in the lesson text, for a reader with no technical experience.

## Notes

A `shell` fence means the command is identical in PowerShell and in Terminal, so it has to be run in both. Task 04 shipped a Java command that worked in Git Bash and failed in PowerShell because it was only ever run in one, and that is the single most repeated bug in this repository's history.

Pick multi-arch base images only. `alpine`, `nginx:alpine`, and `traefik/whoami` are; an amd64-only image warns and runs slowly under emulation on Apple Silicon, and a student with no technical experience will read that warning as having broken something.

## Build notes

- The step keys are `run`, `inside`, `images`, `compose`, and `cleanup`.
  They are stored against student sessions from the first merge on; never
  rename one.
- Three things the walk taught that the lesson would otherwise have got
  wrong. Docker 29 prints `docker image ls` with `IMAGE`, `ID`, `DISK USAGE`,
  and `CONTENT SIZE` columns, not the `REPOSITORY` and `TAG` of older
  versions; the lesson shows the new layout and says the old one carries the
  same information. The no-terminal error has been reworded to `cannot attach
  stdin to a TTY-enabled container because stdin is not a terminal`, and the
  lesson names both that and the older `the input device is not a TTY`, with
  the `winpty` fix for Git Bash. And `docker image rm alpine` only refuses
  while a container uses the image if the image has one tag; on a developer
  machine where `alpine:latest` shares its ID with `alpine:3`, it untags
  instead. A fresh student machine has one tag, so the lesson demonstrates
  the refusal with `hello-world`, which always does.
- `finished.md` names lesson 2 without linking to it (D73). Task 13's spec
  now says to turn that sentence into the link.
- Two code changes. `lessonCountLabel` in the catalog: the home page had
  only ever counted a course with two lessons, and would have said "1 lessons
  and a test". The label still promises a test, which is Task 16's; nothing
  links a Docker student to the certificates test. And a `container` fence
  language in `code-block.tsx` for `ls /`, `ps`, and `exit` typed inside the
  container: a review as a reader with no technical experience caught that
  the `shell` label told a Windows reader to run those in PowerShell. The
  journey asserts the new label is on the page.
- The same review moved the "if your prompt did not change" branch above the
  commands it protects, moved the "the deploy website is still running"
  branch from step 4 to step 2 where `docker ps` first shows it, and caught
  that the quoted `docker system df` output had `RECLAIMABLE` wrong: Docker
  counts an image as active while any container from it exists, stopped or
  not, which `docker system df -v` confirmed, so the lesson now teaches that
  instead of contradicting it.
- `e2e/home-courses.spec.ts` had to change, since it asserted Docker was
  coming soon. Its "Go to the lesson" click is now scoped to the certificates
  card, because there are two such links.
- The new journey reads the count from the progress bar's `aria-valuenow`
  rather than the "1 of 5 steps done" text, because once a run has been set
  aside the same words appear under "Earlier sessions".
- The Docker Hub numbers (a hundred pulls per six hours per address, two
  hundred per signed-in user) are from `docs.docker.com/docker-hub/usage/` on
  2026-09-13. Killercoda's one hour per session is from its FAQ; iximiuz
  Labs' one hour a day is from its pricing page.
- The desktop app's browser pane starts `pnpm run dev` on port 3000 through
  an untracked `.claude/launch.json`, and Next refuses a second dev server in
  the same directory, so `pnpm test:e2e` fails until that server is stopped.
  `.claude/` is not committed.
