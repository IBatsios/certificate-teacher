<!-- Hand-written for v2. Not generated from docs/intake.md; do not run /kickoff over it. -->

# 12: Docker lesson 1 — what a container actually is

**What to build:** "As a student, I can learn what a container is by running one, so that the Docker I already used in the deploy lesson stops being magic." The first lesson of the Docker course, at `content/lessons/containers/`. From the user's side: they run their first container, look inside it, then re-read the `docker-compose.yml` they wrote in the certificates course and find that they can now read every line of it.

**Blocked by:** 10, 11.

**Status:** not started.

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

- [ ] As a student, I can open the Docker course from the home page, work through lesson 1, and have every tick saved between visits.
- [ ] Starting over on the Docker course leaves certificate progress untouched, and the reverse. Covered end to end.
- [ ] Every command in the lesson has been run by a person, in both PowerShell and Terminal, and the output matches what the lesson says it will be.
- [ ] The sandbox fallback links resolve and the lesson states the session time limit.
- [ ] The end-to-end test passes: `e2e/docker-containers.spec.ts`.
- [ ] Every earlier test still passes locally. CI green on the pull request.

## Suggested skills

- `frontend-design-direction`, `make-interfaces-feel-better`, `front-a11y`: this is the first screen of a new course.
- `e2e-testing`: the journey, and the cross-course isolation assertion.
- `error-handling`: every "if this goes wrong" branch in the lesson text, for a reader with no technical experience.

## Notes

A `shell` fence means the command is identical in PowerShell and in Terminal, so it has to be run in both. Task 04 shipped a Java command that worked in Git Bash and failed in PowerShell because it was only ever run in one, and that is the single most repeated bug in this repository's history.

Pick multi-arch base images only. `alpine`, `nginx:alpine`, and `traefik/whoami` are; an amd64-only image warns and runs slowly under emulation on Apple Silicon, and a student with no technical experience will read that warning as having broken something.
