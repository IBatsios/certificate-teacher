---
key: env
title: Environment variables, and what never goes in an image
---

A program often needs a setting that should not be built into it: which database to talk to, what name to show, a password. Docker hands those over as **environment variables**, named values a program can read when it starts. `-e` sets one for a single run:

```shell
docker run --rm -e GREETING=hello alpine env
```

```text
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
HOSTNAME=aafdc309595b
GREETING=hello
HOME=/root
```

`env` prints every variable the container was started with, and there is yours, among the three Docker sets on its own. Run the same command without `-e` and `GREETING` is not there. It was given to that one container, at that one start, and it is not in the image; nothing set with `-e` ever is.

**`ENV` in a Dockerfile is the other way, and it is the way that goes wrong.** Make a small recipe next to `my-site` to see exactly how. Go up a level and make a folder:

```shell
cd ..
mkdir leaky
cd leaky
```

Create a file called `secret.txt` in it, containing one line:

```file
my password is hunter2
```

and a `Dockerfile`, containing this:

```file
FROM alpine
ENV DB_PASSWORD=hunter2
COPY secret.txt /secret.txt
RUN rm /secret.txt
```

A password written into the recipe with `ENV`, and a file with a password in it copied in and then, on the very next line, deleted. Whoever wrote this thought the deletion tidied up after them. Build it:

```shell
docker build -t leaky .
```

Docker itself objects, at the end of the build:

```text
 1 warning found (use docker --debug to expand):
 - SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "DB_PASSWORD") (line 2)
```

It builds anyway. Now look at what anyone who has this image can see, without running it:

```shell
docker image inspect --format '{{.Config.Env}}' leaky
```

```text
[PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin DB_PASSWORD=hunter2]
```

The password, in plain text, in the image's own description. An `ENV` line is part of the image the way a `COPY` is, and it goes wherever the image goes: to every computer that pulls it, for as long as the image exists. The check at the end of this course reads exactly this list from your image, and fails it if any name in there says `PASSWORD`, `SECRET`, `KEY`, or `TOKEN`.

**And the deleted file.** It is gone, if you ask a container:

```shell
docker run --rm leaky ls /secret.txt
```

```text
ls: /secret.txt: No such file or directory
```

But ask the image how it was built:

```shell
docker history leaky
```

```text
IMAGE          CREATED          CREATED BY                                      SIZE      COMMENT
81f0efec66d4   10 seconds ago   RUN /bin/sh -c rm /secret.txt # buildkit        4.1kB     buildkit.dockerfile.v0
<missing>      10 seconds ago   COPY secret.txt /secret.txt # buildkit          8.19kB    buildkit.dockerfile.v0
<missing>      10 seconds ago   ENV DB_PASSWORD=hunter2                         0B        buildkit.dockerfile.v0
<missing>      2 months ago     CMD ["/bin/sh"]                                 0B        buildkit.dockerfile.v0
<missing>      2 months ago     ADD alpine-minirootfs-3.24.1-x86_64.tar.gz /…   9.07MB    buildkit.dockerfile.v0
```

One row per line of the recipe, newest at the top, each with the size of the layer it made. The `COPY` layer is still there, eight kilobytes, holding the file. The `RUN rm` layer above it is a note saying the file is hidden from now on, which is all a deletion in a later layer can ever be. Lesson 2 told you a file in a layer stays in that layer; here is the layer, sitting in the image with its size beside it. `docker image save` writes an image out as a plain archive of its layers, and the file is in the `COPY` layer, for anyone to open. Nothing you do after the copy can take it out. Only a build that never copied it in.

**So the rule.** A secret is given to a container when it runs: with `-e`, with `environment:` in a Compose file, or as a read-only mount, the way your private key was. It is never written in a Dockerfile, and never left in a folder that `COPY .` will gather, which is what `.dockerignore` was for. The private key in the certificates course was the first form of this rule, and this is the second: the safe number of copies of a secret is one, and an image is a copy you cannot get back.

Remove the experiment, image and folder both, and go back to the site:

```shell
docker image rm leaky
cd ..
rm -r leaky
cd my-site
```

Tick this step when `docker image inspect` has shown you the password sitting in the image.
