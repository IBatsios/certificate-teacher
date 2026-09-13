---
key: smaller
title: Make it smaller
---

Look at the sizes in that last list, and then at the image you started from:

```shell
docker image ls nginx:alpine
```

```text
IMAGE          ID             DISK USAGE   CONTENT SIZE   EXTRA
nginx:alpine   72ba65eb42c1        103MB         29.7MB
```

The web server on its own is 30 megabytes to download and 103 on disk. Your site, which is that web server plus one page, is 80 to download and 394 on disk. The other 300 megabytes are the converter. It was needed for one moment, to turn `index.md` into `index.html` while the image was being built, and it will never run again: the web server serves the finished page and has no use for the program that made it. But it was installed in the image, so it is in every copy of the image, for ever.

**A multi-stage build fixes this.** A Dockerfile can have more than one `FROM`, and each one starts a new **stage**. Only the last stage becomes the image; the others are workbenches, thrown away when the build is done, and a later stage can reach back and copy out of an earlier one. So: one stage that installs the converter and makes the page, and a second that takes only the finished page onto a clean web server. Replace the whole of your `Dockerfile` with this:

```file
FROM alpine AS build
RUN apk add --no-cache pandoc-cli
COPY . /site/
RUN pandoc /site/index.md --standalone --metadata pagetitle="My website" --output /site/index.html

FROM nginx:alpine
COPY --from=build /site/index.html /usr/share/nginx/html/index.html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

The first stage starts from plain `alpine`, the tiny Linux from the last lesson, because a workbench needs no web server; `AS build` gives the stage a name. It installs the converter, copies your files in, and makes the page. The second stage starts fresh from `nginx:alpine`, and its `COPY --from=build` takes one file out of the first stage. Everything else in that first stage, the converter and your `index.md` with it, stays behind.

Build it as version 3, and compare:

```shell
docker build -t my-site:3 .
docker image ls my-site
```

```text
IMAGE            ID             DISK USAGE   CONTENT SIZE   EXTRA
my-site:1        d1f016cf0326        394MB         80.4MB
my-site:2        1dc238a114ca        394MB         80.4MB
my-site:3        47db7e5d040c        102MB         28.8MB
my-site:latest   1dc238a114ca        394MB         80.4MB
```

The install runs once more during this build, because it is a new step in a new stage, and is cached from then on. Version 2 to version 3: 394 megabytes on disk to 102, and 80 to download to 29. Version 3 is the web server and your page, and nothing else. Notice too that `latest` is still version 2, with version 2's size: nobody moved it, so it did not move. Leave it there for now.

The check at the end of this course will look at the size of the image you hand it and expect a `CONTENT SIZE` under 50 MB. The two-stage recipe gives you that with room to spare, and the one-stage recipe cannot.

Prove it is the same page:

```shell
docker run --rm -d -p 8088:80 --name my-site my-site:3
```

Open <http://localhost:8088>: your page, version 2's words included. Then stop it, and ask the image what is in `/site`:

```shell
docker stop my-site
docker run --rm my-site:3 ls /site
```

```text
ls: /site: No such file or directory
```

There is no `/site` in version 3. Your Markdown never came across, and neither did the converter; only the page did. That is also worth knowing about a Dockerfile you did not write: what the last stage copies is what ships, and nothing in the stages before it does.

Tick this step when `docker image ls my-site` shows version 3 at about a third of version 2's `CONTENT SIZE`.
