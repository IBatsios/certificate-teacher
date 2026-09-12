<!-- Hand-written for v2. Not generated from docs/intake.md; do not run /kickoff over it. -->

# 14: Docker lesson 3 — run it like a real thing

**What to build:** "As a student, I can run my own image the way something real is run, and put it behind the certificate I made, so that both courses meet." The third lesson of the Docker course, at `content/lessons/run-it-properly/`. From the user's side: ports, volumes, environment variables, networks, a non-root user and a health check — and then the ending, where their own image sits behind the nginx proxy from the certificates course, on https, with their own certificate.

**Blocked by:** 13.

**Status:** not started.

## Steps of the lesson, in order

1. **Ports.** `-p 8080:80`, and the sentence that unlocks the file they wrote months ago: the left number is the computer's, the right one is the container's. `8443:443` was always this.
2. **Volumes.** Write a file inside a container, `docker rm` it, and find the file gone. Do it again with a volume and find it there. Then the bind mount, which is what `./localhost.crt:/etc/nginx/certs/localhost.crt:ro` was, and what `:ro` bought them.
3. **Environment variables, and what never goes in an image.** `-e` at run time versus `ENV` in a Dockerfile. A password baked into an image is in the image forever, for anyone who pulls it, in a layer that deleting the file does not remove. This is the private-key lesson from the certificates course, in a second place.
4. **Networks.** Two containers on one network reaching each other by name. This is why `proxy_pass http://backend:80` resolved: `backend` was a name Docker gave it, and nothing outside that network could use it.
5. **Run it like production.** `USER` so it is not root, and `HEALTHCHECK` so something can tell whether it is actually working rather than merely running. Rebuild as `my-site:3`.
6. **Put it all together, and put your certificate in front of it.** One `docker-compose.yml` that runs their image behind the nginx proxy from the deploy lesson, with `localhost.crt` and `localhost.key` bind-mounted as before. Open `https://localhost:8443` and see their own page, that they built, over https, with a padlock, behind a proxy, on a certificate they signed themselves.

## Steps, a vertical slice in this order

1. Content: `content/lessons/run-it-properly/`, six step files, `lesson.md`, `finished.md` pointing at the check in Task 15 and then the test in Task 16.
2. Catalog: add `run-it-properly` to the Docker course.
3. The compose file in step 6 must be reachable for a student who no longer has `my-certs`. Say so, and link back to the certificates course rather than repeating its commands.
4. Walk every command in **PowerShell and in Terminal**, from a clean machine state, with a browser open for step 6.
5. End-to-end test at `e2e/docker-run.spec.ts`.

## Acceptance criteria

- [ ] As a student, I can finish the lesson with my own image served over https behind the proxy, using the certificate I made in the other course.
- [ ] The lesson states plainly what to do if `my-certs` is gone, and the link back works.
- [ ] Completing this lesson marks the Docker course's steps complete, and does not mark the certificates course complete or incomplete.
- [ ] Every command has been run by a person in both PowerShell and Terminal, including step 6 end to end in a browser.
- [ ] The end-to-end test passes: `e2e/docker-run.spec.ts`.
- [ ] Every earlier test still passes locally. CI green on the pull request.

## Suggested skills

- `e2e-testing`: the journey, and the cross-course completion assertion.
- `front-a11y` and `make-interfaces-feel-better`: step 6 is the payoff screen of the whole course; it should feel like one.
- `error-handling`: port 8443 already in use, a stale container from the deploy lesson still running, and a certificate that has since expired are the three predictable failures here. All three get a sentence.

## Notes

Step 6 is the reason to build this course rather than Kubernetes. It is the moment the two courses stop being two courses. Write it last and write it carefully; everything before it is setup for it.

A student who did the deploy lesson months ago may have a container from it still running and holding port 8443. `docker ps` and `docker compose down` in the right folder is the fix, and the lesson should say so before the student meets the error rather than after.

The certificate from the deploy lesson is valid for a little over two years (Task 03's command), so an expired certificate is unlikely but not impossible. Point at the certificates course rather than teaching `openssl` again here.
