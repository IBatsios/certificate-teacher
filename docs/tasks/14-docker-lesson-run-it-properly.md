<!-- Hand-written for v2. Not generated from docs/intake.md; do not run /kickoff over it. -->

# 14: Docker lesson 3 — run it like a real thing

**What to build:** "As a student, I can run my own image the way something real is run, and put it behind the certificate I made, so that both courses meet." The third lesson of the Docker course, at `content/lessons/run-it-properly/`. From the user's side: ports, volumes, environment variables, networks, a non-root user and a health check — and then the ending, where their own image sits behind the nginx proxy from the certificates course, on https, with their own certificate.

**Blocked by:** 13.

**Status:** built on `feature/docker-lesson-run`, pull request #28 open.

## Steps of the lesson, in order

1. **Ports.** `-p 8088:80`, the number lesson 2 already used (8080 is the port most often taken on a developer machine), and the sentence that unlocks the file they wrote months ago: the left number is the computer's, the right one is the container's. `8443:443` was always this.
2. **Volumes.** Write a file inside a container, `docker rm` it, and find the file gone. Do it again with a volume and find it there. Then the bind mount, which is what `./localhost.crt:/etc/nginx/certs/localhost.crt:ro` was, and what `:ro` bought them.
3. **Environment variables, and what never goes in an image.** `-e` at run time versus `ENV` in a Dockerfile. A password baked into an image is in the image forever, for anyone who pulls it, in a layer that deleting the file does not remove. This is the private-key lesson from the certificates course, in a second place.
4. **Networks.** Two containers on one network reaching each other by name. This is why `proxy_pass http://backend:80` resolved: `backend` was a name Docker gave it, and nothing outside that network could use it.
5. **Run it like production.** `USER` so it is not root, and `HEALTHCHECK` so something can tell whether it is actually working rather than merely running. Rebuild as `my-site:4`; lesson 2 ended on `my-site:3`, the signed multi-stage build, with `latest` moved onto it by hand.
6. **Put it all together, and put your certificate in front of it.** One `docker-compose.yml` that runs their image behind the nginx proxy from the deploy lesson, with `localhost.crt` and `localhost.key` bind-mounted as before. Open `https://localhost:8443` and see their own page, that they built, over https, with a padlock, behind a proxy, on a certificate they signed themselves.

## Steps, a vertical slice in this order

1. Content: `content/lessons/run-it-properly/`, six step files, `lesson.md`, `finished.md` pointing at the check in Task 15 and then the test in Task 16.
2. Catalog: add `run-it-properly` to the Docker course.
3. The compose file in step 6 must be reachable for a student who no longer has `my-certs`. Say so, and link back to the certificates course rather than repeating its commands.
4. Walk every command in **PowerShell and in Terminal**, from a clean machine state, with a browser open for step 6.
5. End-to-end test at `e2e/docker-run.spec.ts`.

## Acceptance criteria

- [x] As a student, I can finish the lesson with my own image served over https behind the proxy, using the certificate I made in the other course. Walked start to finish on 2026-09-13: `my-site:4`, non-root and healthy, behind `nginx:alpine` holding the certificate from `my-certs`, and the browser loaded the page on `https:` with `isSecureContext` true and no warning (build notes, on why the port was 8444 that day).
- [x] The lesson states plainly what to do if `my-certs` is gone, and the link back works. Step 6 says it before the files are written, links to the step of the certificates lesson that starts making them again, and the journey follows the link and lands on that step.
- [x] Completing this lesson marks the Docker course's steps complete, and does not mark the certificates course complete or incomplete. The journey ticks one certificates step, finishes all three Docker lessons, sees the course note on lesson 3, and finds the certificates course at exactly one step done with no run set aside.
- [ ] Every command has been run by a person in both PowerShell and Terminal, including step 6 end to end in a browser. Every fence was run in PowerShell 7 and in Git Bash on Windows, in the lesson's order, with the lesson's exact file contents, and the shell-sensitive ones (`sh -c "..."`, `-v "${PWD}:/site:ro"`, `--format '{{...}}'`) also in Windows PowerShell 5.1; every output the lesson quotes is what those runs printed (build notes). Step 6 was opened in the desktop app's browser, which confirmed the page, the protocol, and the secure context. Still wanting a person: the same walk in Terminal on a Mac, and a hand on the padlock to read `My Root` in the certificate viewer, which no tool here can click.
- [x] The end-to-end test passes: `e2e/docker-run.spec.ts`.
- [x] Every earlier test still passes locally: 243 unit tests and 49 Playwright journeys (48 plus the new one) on 2026-09-13. CI on pull request #28: see the status line.

## Suggested skills

- `e2e-testing`: the journey, and the cross-course completion assertion.
- `front-a11y` and `make-interfaces-feel-better`: step 6 is the payoff screen of the whole course; it should feel like one.
- `error-handling`: port 8443 already in use, a stale container from the deploy lesson still running, and a certificate that has since expired are the three predictable failures here. All three get a sentence.

## Notes

Step 6 is the reason to build this course rather than Kubernetes. It is the moment the two courses stop being two courses. Write it last and write it carefully; everything before it is setup for it.

A student who did the deploy lesson months ago may have a container from it still running and holding port 8443. `docker ps` and `docker compose down` in the right folder is the fix, and the lesson should say so before the student meets the error rather than after.

The certificate from the deploy lesson is valid for a little over two years (Task 03's command), so an expired certificate is unlikely but not impossible. Point at the certificates course rather than teaching `openssl` again here.

## Build notes

- The step keys are `ports`, `volumes`, `env`, `networks`, `production`,
  and `https`. They are stored against student sessions from the first
  merge on; never rename one.
- One code change, and it is the catalog: `run-it-properly` on the end of
  the Docker course's `lessonSlugs`. The page already fills
  `{{challenge-token}}` for every lesson, so the token rides into step 5's
  recipe with nothing new; the journey checks it is the same token lesson 2
  showed, since both lessons share the course's run.
- The final image is built on `nginxinc/nginx-unprivileged:alpine`, not on
  `nginx:alpine` with `USER nginx` added (D75). The walk ran the latter and
  it dies at once on `mkdir() "/var/cache/nginx/client_temp" failed (13:
  Permission denied)`, which the lesson now quotes as the "watch it fail
  first" moment before switching base. The unprivileged image runs as uid
  101, listens on 8080, and is 25.8 MB content size against 28.8 MB for
  version 3, so step 5 gets to reinforce step 1's right-hand number and
  lesson 2's size lesson for free.
- The health check asks `http://127.0.0.1:8080/`, not `localhost`. The
  first walk used `localhost` and the container stayed `(health: starting)`
  and then `unhealthy` with `wget: can't connect to remote host: Connection
  refused`: inside the container `localhost` resolves to `::1` first, and
  the unprivileged image's default configuration has only `listen 8080;`.
  With `depends_on: condition: service_healthy` that becomes a stack whose
  proxy never starts (`dependency failed to start: container my-site-site-1
  is unhealthy`), so the lesson gives the reason in one sentence.
- Port 8443 was held on the machine this was written on by a deploy-lesson
  stack of the developer's own (`nginx-docker-proxy-1`, from
  `Documents\my-certs\nginx-docker`, up since 2026-09-10), which is exactly
  the stale-container failure the task predicts. It was left running. The
  walk hit the real error, `Bind for 0.0.0.0:8443 failed: port is already
  allocated`, found the holder with `docker ps --filter publish=8443`, which
  is now the command the lesson opens step 6 with, and took the lesson's
  own fallback of `8444:443` for the browser check.
- A missing certificate file does not fail `docker compose up`. Docker
  creates an empty *directory* named `localhost.crt` in `my-certs` in its
  place, Compose prints `Started` for the proxy, and the proxy then exits
  with `cannot load certificate "/etc/nginx/certs/localhost.crt":
  PEM_read_bio_X509_AUX() failed (SSL: error:0480006C:PEM routines::no start
  line ...)`. The browser then says the site cannot be reached. The lesson
  has a sentence for it, including deleting the stray folder, because a
  student who has since made new certificates will otherwise find the file
  refusing to be created.
- Git Bash on Windows breaks the `-v` line worse than lesson 2's `//` trick
  can fix: `-v "${PWD}:/site:ro"` is rewritten into a Windows path list,
  Docker accepts it, a folder called `my-site;C` appears next to the site,
  and nothing is mounted. `MSYS_NO_PATHCONV=1` in front of the command is
  the real fix and `//site` is not, so the lesson tells Git Bash users to
  use PowerShell and says why in step 2. Terminal on a Mac or Linux is
  unaffected; the Git Bash walk used `MSYS_NO_PATHCONV=1` and `//` where
  needed and otherwise matched the PowerShell walk line for line.
- A wrong right-hand port number (`-p 8088:8080` against an image listening
  on 80) gives `curl: (52) Empty reply from server`; a browser says the
  site sent no data or reset the connection. The desktop app's browser
  pane refuses to render either error page, so the browser wording in step
  1 is Chrome's and Firefox's known text, not a capture.
- Docker's own BuildKit warning, `SecretsUsedInArgOrEnv: Do not use ARG or
  ENV instructions for sensitive data`, fires on the step 3 recipe and is
  quoted in the lesson. `docker history` on the containerd store reports
  the `COPY` layer as `8.19kB` and the `RUN rm` as `4.1kB` for a
  23-byte file; the lesson quotes those.
- `docker compose up -d` was captured in its plain layout (`Container
  my-site-site-1 Healthy`), which is what a non-terminal gets; the lesson
  quotes the terminal layout (`✔ Container my-site-site-1   Healthy`) a
  student sees, with the same three lines in the same order. Same
  arrangement as Task 13's BuildKit output.
- Rebuilding `my-site:4` while a Compose container is running from the
  previous build makes `docker compose ps` show that container's image as a
  `sha256:` rather than `my-site:4`, because Docker 29's containerd store
  gives the rebuild a new ID (Task 13's build notes). Harmless, and the
  lesson does not mention it.
- The walk was scripted so that both shells ran the same commands with the
  same files in the same order (`walk-ps.ps1`, `walk-ps-2.ps1`,
  `walk-ps51.ps1`, and `walk-bash.sh`, kept out of the repository), from a
  scratch home holding lesson 2's end state and a copy of the developer's
  `my-certs` certificate files, never the real folder. The 5.1 script's
  bind-mount line mounted the repository folder rather than `my-site`, a
  three-argument `Join-Path` that 5.1 lacks; the syntax under test behaved
  the same, and the `:ro` refusal was reproduced.
- The lesson-page screenshot in the browser pane timed out repeatedly
  (the pane does not draw while the window is behind another), so the
  https proof is `location.protocol`, `window.isSecureContext`, and the
  page's own heading read from the tab, plus the proxy's log showing the
  request arrive from the Chrome user agent with a `200`.
- Task 15's spec gained a note on what this lesson leaves running and the
  shape of the final image: the Compose site container publishes no port
  by design, so `port-is-published` must be judged on the step 5 container
  or the proxy (D75).
- `build-an-image/finished.md` now links to this lesson, as D73 said it
  would. The build journey asserts the link's target; the run journey
  follows it.
