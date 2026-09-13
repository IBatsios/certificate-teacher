---
key: production
title: Not as root, and able to say it is working
---

Two things separate the containers you have run so far from a container anyone would run for real. Ask your image who it runs as:

```shell
docker run --rm my-site:3 whoami
```

```text
root
```

Everything you have started in this course has run as `root`, the administrator, inside its container. The walls of a container are good, and they have had holes, and a program that is broken into while running as root is a far worse place to start from than one running as an ordinary user. It is the same reason you do not do your everyday work in an administrator account. A program that serves web pages needs to read a folder and answer on a port, and it should run as a user who can do nothing else.

**Watch it fail first.** `--user` starts a container as someone other than root, and the nginx image already has a user called `nginx` in it. Try:

```shell
docker run --rm --user nginx my-site:3
```

```text
nginx: [warn] the "user" directive makes sense only if the master process runs with super-user privileges, ignored in /etc/nginx/nginx.conf:2
...
nginx: [emerg] mkdir() "/var/cache/nginx/client_temp" failed (13: Permission denied)
```

It stops at once: the server wanted to make a folder that only root may make there, and that is only the first of its complaints. The `nginx:alpine` image was built to be started as root and to hand the actual work to `nginx` on its own, which is an old and respectable arrangement, and not the one this step is teaching. The people who publish nginx also publish a version built to be run as an ordinary user from the first moment, called `nginx-unprivileged`. It keeps its working files in folders that user owns, and it listens on **8080** instead of 80, because an ordinary user could not always open a port below 1024. That is the image to build on. Its page on Docker Hub is where the number 8080 comes from, and it is the general rule: when you build on somebody's image, their page tells you which port it listens on and which user it runs as.

**Rewrite the recipe.** Replace the whole of your `Dockerfile` with this. Your token is on the `LABEL` line, as it was last lesson:

```file
FROM alpine AS build
RUN apk add --no-cache pandoc-cli
COPY . /site/
RUN pandoc /site/index.md --standalone --metadata pagetitle="My website" --output /site/index.html

FROM nginxinc/nginx-unprivileged:alpine
LABEL teacher.challenge="{{challenge-token}}"
COPY --from=build /site/index.html /usr/share/nginx/html/index.html
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --retries=3 CMD wget -q --spider http://127.0.0.1:8080/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

Four lines changed, all in the second stage:

- **`FROM nginxinc/nginx-unprivileged:alpine`**: the non-root build of the same server. The name has a slash because it is published by the `nginxinc` account rather than as an official image, as `traefik/whoami` was.
- **`USER nginx`**: from this line down, everything in the build and everything at run time happens as this user, not as root. The unprivileged image already says this; it is here so that anyone reading your recipe sees it without having to know what the base image does, like the `CMD` line in lesson 2.
- **`EXPOSE 8080`**: the note about which port the server listens on, corrected.
- **`HEALTHCHECK`**: a command Docker runs inside the container every ten seconds, and the answer to a question `docker ps` could not answer before. Not "is it running" but "is it working". This one fetches the page from the server, with `--spider` meaning check that it is there without saving it, and `|| exit 1` turns any failure into the signal Docker understands. It asks `127.0.0.1` rather than `localhost` because inside this container `localhost` means the newer kind of address first, and the server is not listening on that one. Three failures in a row, `--retries=3`, and the container is marked unhealthy.

Build it as version 4, and run it. Look at the `-p`: the right-hand number is 8080 now, for the reason step 1 gave.

```shell
docker build -t my-site:4 .
docker run --rm -d -p 8088:8080 --name my-site my-site:4
docker ps
```

```text
CONTAINER ID   IMAGE       COMMAND                  CREATED         STATUS                            PORTS                                         NAMES
6af42547488c   my-site:4   "/docker-entrypoint.…"   2 seconds ago   Up 2 seconds (health: starting)   0.0.0.0:8088->8080/tcp, [::]:8088->8080/tcp   my-site
```

`(health: starting)`: the first check has not run yet. Wait ten seconds and run `docker ps` again:

```text
CONTAINER ID   IMAGE       COMMAND                  CREATED          STATUS                    PORTS                                         NAMES
6af42547488c   my-site:4   "/docker-entrypoint.…"   13 seconds ago   Up 12 seconds (healthy)   0.0.0.0:8088->8080/tcp, [::]:8088->8080/tcp   my-site
```

`(healthy)`. The server answered its own check, and will go on being asked every ten seconds; `docker logs my-site` shows each one arriving, a `GET /` from `Wget`. Open <http://localhost:8088> and it answers you too: the same page, now served by a program that cannot write outside its own folders, on a port that needed no permission, from an image three megabytes smaller than version 3. Check who is running it:

```shell
docker run --rm my-site:4 whoami
```

```text
nginx
```

Stop it, and move `latest` on, since version 4 is now the one you would run:

```shell
docker stop my-site
docker tag my-site:4 my-site:latest
```

There is more to running something for real than these two lines, memory limits and restart rules among it, but these two are where every checklist starts. They are also two of the things the check at the end of this course looks for in your image, with the tag, the size, the label, the published port, and the environment from step 3.

Tick this step when `docker ps` shows `my-site` as `(healthy)` and `whoami` in it prints `nginx`.
