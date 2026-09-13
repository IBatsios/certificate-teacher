---
key: cleanup
title: Clean up, and why a disk fills up if you never do
---

Docker keeps everything until you say otherwise: every stopped container, and every image you ever downloaded. Ask it how much:

```shell
docker system df
```

```text
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          2         2         13MB      0B (0%)
Containers      4         0         16.4kB    16.4kB (100%)
Local Volumes   0         0         0B        0B
Build Cache     0         0         0B        0B
```

Yours will be small today, and the sizes will differ a little. It does not stay small. An image is anywhere from a few megabytes to a few gigabytes, every container you run and forget keeps its image alive, and nothing is ever removed on your behalf, so a computer that has used Docker for a year without cleaning up is routinely carrying tens of gigabytes it does not need. `RECLAIMABLE` is what Docker would give back if you asked.

Read the `Images` row closely. Both images count as `ACTIVE`, and nothing on that row is reclaimable, even though you are finished with all of it. Docker counts an image as in use while any container made from it exists, stopped or not. That rule decides the order of everything below.

**See the safety net first.** Try to remove the `hello-world` image while the container from step 1 still exists:

```shell
docker image rm hello-world
```

```text
Error response from daemon: conflict: unable to delete hello-world:latest (must be forced) - container 6ede3f48d720 is using its referenced image 5e2309035332
```

Docker refuses. A container, even a stopped one, is a run of its image, and its files sit on top of the image's files, so the image stays while the container does. That refusal is the safety net, and it is why cleaning up goes in a fixed order: containers first, then images.

**Remove the containers.** List them:

```shell
docker ps -a
```

```text
CONTAINER ID   IMAGE         COMMAND      CREATED          STATUS                      PORTS     NAMES
56160c2bc9f3   alpine        "hostname"   12 minutes ago   Exited (0) 12 minutes ago             suspicious_mcclintock
cf456aa10a4b   alpine        "hostname"   12 minutes ago   Exited (0) 12 minutes ago             jovial_wright
a04506500cbe   alpine        "sh"         20 minutes ago   Exited (0) 18 minutes ago             suspicious_jepsen
6ede3f48d720   hello-world   "/hello"     25 minutes ago   Exited (0) 25 minutes ago             friendly_shockley
```

Four rows: the `hello-world` from step 1, the shell from step 2, and the two `hostname` runs from step 3. Remove each by its name from the `NAMES` column. Yours have different names from these, and `docker rm` takes several at once:

```shell
docker rm suspicious_mcclintock jovial_wright suspicious_jepsen friendly_shockley
```

It prints back each name it removed. If you mistype one, Docker says `No such container` for that one and still removes the others; run `docker ps -a` again to see what is left, and remove it. When the list is empty, go on.

**Now remove the images.**

```shell
docker image rm hello-world
docker image rm alpine
```

```text
Untagged: hello-world:latest
Deleted: sha256:5e23090353324d887c48ad5e5c56d294eab81588df9605b07d1afe895f9cc8f8
Untagged: alpine:latest
Deleted: sha256:...
```

`Untagged` is the name going, and `Deleted` is the data going with it; some installs print a few more `Deleted` lines, one for each layer of the image. `docker image ls` no longer lists either, and `docker system df` no longer counts them. Removing `alpine` is deliberate practice: the next lesson downloads it again in a few seconds. Leave `nginx:alpine` and `traefik/whoami` where they are if you have them; the last lesson of this course uses both, and together they are a little over a hundred megabytes.

**When it is your own computer and not a lesson**, the everyday version of all this is one command, `docker system prune`, which removes every stopped container, every network nothing uses, every image that has lost its name, and any build cache nothing uses, after asking you once. It is worth knowing, and worth reading the question it asks before answering, because it does exactly what it says.

Tick this step when `docker ps -a` shows none of this lesson's containers and `docker image ls` no longer shows `hello-world`.
