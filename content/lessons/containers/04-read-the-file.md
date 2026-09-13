---
key: compose
title: Read the file you already wrote
---

In the deploy lesson you created a file called `docker-compose.yml` in your `my-certs` folder, and started a website with it. Open it again; `cat` prints a file in PowerShell and in Terminal alike:

```shell
cd my-certs
cat docker-compose.yml
```

**If PowerShell says `Cannot find path`, or Terminal says `No such file or directory`**, the folder is not where you are standing. It is wherever you made it in the certificates course, usually your home folder, so close this window, open a fresh PowerShell or Terminal, and try again from there. If you did not do that course, or the folder is gone, here is the file. Read it here instead.

```yaml
services:
  proxy:
    image: nginx:alpine
    ports:
      - "8443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./localhost.crt:/etc/nginx/certs/localhost.crt:ro
      - ./localhost.key:/etc/nginx/certs/localhost.key:ro
  backend:
    image: traefik/whoami
```

Read it with the last three steps in mind.

**`services:`** lists the containers to start, and there are two: one called `proxy`, one called `backend`. `docker compose up` is `docker run` for several containers at once, with the details written in a file instead of typed. That is all Compose is.

**`image: nginx:alpine`** is an image, exactly like the `alpine` you ran in step 2. `nginx` is a web server, and the `:alpine` after the colon picks the version of it built on the same tiny Linux you had a prompt inside. The `proxy` container is one run of that image.

**`image: traefik/whoami`** is another image. The name has a slash because it was published by an account called `traefik`. `alpine` and `nginx` have no slash because they are **official images**, a set that Docker Hub looks after itself under its own name, `library`; that is the `library/hello-world` you saw Docker pulling in step 1. The `backend` container is one run of it.

**`ports:`** and **`volumes:`** are the next two lessons. For now: the first opens a door from your computer into the container, which is how your browser reached a program that had its own sealed-off filesystem; the second puts a file of yours inside that filesystem, which is how your certificate got into the proxy. In step 2 you saw that a container has its own files, and `volumes:` is the deliberate exception. Notice that `nginx.conf` and the two certificate files go into the proxy and nowhere else, so the backend never sees your private key.

Now look at the images again:

```shell
docker image ls
```

`nginx:alpine` and `traefik/whoami` are there, if you did the deploy lesson. `docker compose down`, whether you ran it at the end of that lesson or in step 2 of this one, stopped and removed the two containers; the images stayed, because removing a container never removes its image. That is what the next step is about.

Tick this step when you can say, for each of the two `image:` lines, which image it names and which container is a run of it.
