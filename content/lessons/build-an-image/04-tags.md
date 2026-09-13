---
key: tags
title: Tags, and what latest really is
---

List your images by name:

```shell
docker image ls my-site
```

```text
IMAGE       ID             DISK USAGE   CONTENT SIZE   EXTRA
my-site:1   d1f016cf0326        394MB         80.4MB
```

One row. The `:1` is a **tag**: a name for one version of an image, chosen by whoever built it, which this time is you. You have built `my-site:1` seven times now, and each build put the name on the new image and took it off the old one, which is fine while you are learning. But a version number is meant to mean something, so from here on, a change to the page gets a new number.

**Make version 2.** Add a line to the end of `index.md`, so the file ends with:

```file
This is version 2.
```

Build it with a new tag:

```shell
docker build -t my-site:2 .
docker image ls my-site
```

```text
IMAGE       ID             DISK USAGE   CONTENT SIZE   EXTRA
my-site:1   d1f016cf0326        394MB         80.4MB
my-site:2   1dc238a114ca        394MB         80.4MB
```

Two rows, two versions, both kept. You can run either; `docker run ... my-site:1` is the old page and `... my-site:2` is the new one. That is what tags are for: a version you can name is a version you can go back to.

**Now the word `latest`.** In the last lesson you ran `alpine` and `hello-world` with no tag at all, and got the newest one each time. Try that with your own image:

```shell
docker run --rm my-site echo hello
```

```text
Unable to find image 'my-site:latest' locally
docker: Error response from daemon: pull access denied for my-site, repository does not exist or may require 'docker login'
```

Read the first line. A name with no tag means the tag `latest`, and you never made one, so there is no `my-site:latest`; Docker even went looking for one on Docker Hub. `latest` is not a rule that Docker enforces and not a fact Docker works out. It is a plain tag like `1` and `2`, and it means "the newest" only because the people who publish `alpine` and `nginx` are careful to move it onto their newest version. Nothing makes them, and nothing checks.

**Give version 2 that name too.** An image can have as many tags as you like, and `docker tag` adds one:

```shell
docker tag my-site:2 my-site:latest
docker image ls my-site
```

```text
IMAGE            ID             DISK USAGE   CONTENT SIZE   EXTRA
my-site:1        d1f016cf0326        394MB         80.4MB
my-site:2        1dc238a114ca        394MB         80.4MB
my-site:latest   1dc238a114ca        394MB         80.4MB
```

Three rows, but look at the `ID` column: `my-site:2` and `my-site:latest` have the same one. Nothing was copied. It is one image with two names, and `docker run --rm my-site echo hello` now prints `hello`. And `latest` will go on meaning version 2 until you move it, whatever you build next; the next step shows exactly that.

An older Docker prints this list with the name and the tag in separate `REPOSITORY` and `TAG` columns, as the last lesson said. It is the same information.

Tick this step when `docker image ls my-site` shows `1`, `2`, and `latest`.
