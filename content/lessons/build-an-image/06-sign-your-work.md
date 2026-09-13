---
key: sign
title: Sign your work
---

At the end of this course you will hand this app the description of an image you built, and it will check that the lessons were applied. But a description is only text, and anyone could paste in anyone else's. So the app gives you a token that belongs to this run of the course, you bake it into your image, and the check looks for it.

**Your token is `{{challenge-token}}`.** It is yours, and this session's: reload this page tomorrow and it is the same, but another student's is different, and if you start this course over, the new run gets a new one.

**Put it in the image as a label.** A `LABEL` is a note attached to an image, a name and a value, that anyone holding the image can read; most published images carry one naming whoever maintains them. Add one line to the second stage of your `Dockerfile`, right after its `FROM`, so the file reads:

```file
FROM alpine AS build
RUN apk add --no-cache pandoc-cli
COPY . /site/
RUN pandoc /site/index.md --standalone --metadata pagetitle="My website" --output /site/index.html

FROM nginx:alpine
LABEL teacher.challenge="{{challenge-token}}"
COPY --from=build /site/index.html /usr/share/nginx/html/index.html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build version 3 again:

```shell
docker build -t my-site:3 .
```

Quick, this time: the first stage is `CACHED` from top to bottom, and only the second stage runs, from the new line down. Now ask the image for its labels:

```shell
docker image inspect --format '{{json .Config.Labels}}' my-site:3
```

```text
{"maintainer":"NGINX Docker Maintainers <docker-maint@nginx.com>","teacher.challenge":"{{challenge-token}}"}
```

Two labels. The first came with `nginx:alpine`, which is the maintainers signing their work; the second is yours. `docker image inspect` on its own, without the `--format` part, prints everything Docker knows about the image, seventy-odd lines of it, and that is what the check at the end of the course will ask you for; the labels are one small part of it.

**Move `latest` last.** Version 3 is finished, so let the name mean it:

```shell
docker tag my-site:3 my-site:latest
```

**If you start over** on this page, the new run has a new token, and the label in this image no longer matches it. That is not a problem, only a rebuild: put the new token in the `LABEL` line and build version 3 again.

Tick this step when the labels printed above include `teacher.challenge` with your token.
