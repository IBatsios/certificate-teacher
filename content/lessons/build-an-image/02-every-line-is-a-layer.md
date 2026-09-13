---
key: layers
title: Every line is a layer
---

Build it again, changing nothing:

```shell
docker build -t my-site:1 .
```

```text
 => CACHED [2/4] COPY . /site/
 => CACHED [3/4] RUN apk add --no-cache pandoc-cli
 => CACHED [4/4] RUN pandoc /site/index.md --standalone --metadata pagetitle="My w
```

It finishes in about a second, and every step says `CACHED`. Each line of a Dockerfile makes a **layer**: the files that line added or changed, stacked on top of the layers below it. Docker keeps every layer it has built, and before running a step it checks whether it has already run that exact step on top of those exact layers. Nothing changed, so nothing ran.

**Now change the page.** Open `index.md` and add a line at the end, so the file reads:

```file
# Your Name's website

This page is served by a container I built myself.

I changed it and built it again.
```

Build again, and watch:

```shell
docker build -t my-site:1 .
```

```text
 => [2/4] COPY . /site/
 => [3/4] RUN apk add --no-cache pandoc-cli
 => [4/4] RUN pandoc /site/index.md --standalone --metadata pagetitle="My w
```

The `COPY` ran, which is fair: the file it copies changed. But the `apk add` ran too, and the build took its fifteen seconds again, installing the converter and writing out the three-hundred-megabyte layer it makes, though nothing about that line changed. That is the rule of layers: each one is built on the one below, so when a layer changes, every layer above it is thrown away and built again. Docker does not know that the install would have come out the same; it only knows the ground under it moved.

**So put the things that change least at the top.** The converter is installed once and never changes. Your page changes every time you edit it. Swap the two lines so the install comes before the copy:

```file
FROM nginx:alpine
RUN apk add --no-cache pandoc-cli
COPY . /site/
RUN pandoc /site/index.md --standalone --metadata pagetitle="My website" --output /usr/share/nginx/html/index.html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build once more, with the same command as before:

```shell
docker build -t my-site:1 .
```

The install runs one last time, because it is now a different step in a different place, and Docker has never run _this_ step on top of `nginx:alpine` alone. Then edit `index.md` again, changing the last line to say `built it twice`, and build again:

```shell
docker build -t my-site:1 .
```

```text
 => CACHED [2/4] RUN apk add --no-cache pandoc-cli
 => [3/4] COPY . /site/
 => [4/4] RUN pandoc /site/index.md --standalone --metadata pagetitle="My w
```

Two seconds. The install is `CACHED` and stays cached from now on, however often you change the page, because the page is above it. Every Dockerfile you ever read will be arranged this way: the base image, then the tools, then the things that change, and the reason is the fifteen seconds you just saved.

If you want to see the new page, run it as in step 1 and open <http://localhost:8088>, then stop it. You will do that again at the end of the lesson, so it is fine to skip it here.

Tick this step when a build after a change to the page says `CACHED` for the `apk add` line.
