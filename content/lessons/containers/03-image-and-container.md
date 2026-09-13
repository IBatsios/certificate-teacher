---
key: images
title: Image and container are different words
---

Two lists tell the story of what you have done so far. Run them one after the other.

```shell
docker image ls
```

```text
IMAGE                ID             DISK USAGE   CONTENT SIZE   EXTRA
alpine:latest        28bd5fe8b56d         13MB         3.93MB   U
hello-world:latest   5e2309035332       25.9kB         9.49kB   U
```

These are the **images**: the things you downloaded. Two so far, and if you did the deploy lesson, `nginx:alpine` and `traefik/whoami` are in the list as well, still here from that day. The `:latest` after each name is a **tag**, a label for one version of an image; you did not ask for one, so Docker assumed `latest`, and the next step shows an image where somebody chose a different one. An older Docker prints the same list with the name and the tag in separate `REPOSITORY` and `TAG` columns; it is the same information.

```shell
docker ps -a
```

```text
CONTAINER ID   IMAGE         COMMAND    CREATED          STATUS                      PORTS     NAMES
a04506500cbe   alpine        "sh"       5 minutes ago    Exited (0) 4 minutes ago              suspicious_jepsen
6ede3f48d720   hello-world   "/hello"   10 minutes ago   Exited (0) 10 minutes ago             friendly_shockley
```

These are the **containers**: every run you have made. `docker ps` on its own shows only the ones still running, which is why it was empty a moment ago; `-a` means all of them, stopped ones included. There is the `sh` you were sitting inside, marked `Exited`, and the `hello-world` from step 1. Docker keeps a stopped container around, files and all, until you delete it.

The `NAMES` column is Docker's doing: every container gets a made-up name, an adjective and a scientist, so you have something to call it that is easier than the ID. Yours will differ from these.

**An image is the thing you downloaded. A container is one run of it.** The image is like a recipe, or a program on a disc: it never changes, and you can start it as many times as you like. Each start is a new container, with its own name and its own copy of the files, and what happens in one does not touch another. To see that, run `alpine` twice more, asking it each time what it thinks its own name is:

```shell
docker run alpine hostname
docker run alpine hostname
```

```text
cf456aa10a4b
56160c2bc9f3
```

Two different answers, because these are two different containers, each of which believes it is a computer named after its own ID. Now `docker ps -a` lists three from `alpine`, the shell from step 2 and these two, all `Exited`, all made from the one image, which `docker image ls` still shows exactly once.

Nothing was downloaded this time, either. Those two runs came back in a blink compared with step 1, because the image was already here and Docker skipped straight to starting it. Downloading is a once-per-image cost; running is close to free.

Tick this step when `docker ps -a` shows three containers from `alpine` and `docker image ls` shows one.
