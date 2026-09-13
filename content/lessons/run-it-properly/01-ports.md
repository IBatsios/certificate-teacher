---
key: ports
title: Ports, and which number is whose
---

Open a fresh PowerShell on Windows, or Terminal on a Mac or Linux, and go to the site folder from the last lesson:

```shell
cd my-site
```

**Run your image with no door in it.** Every `docker run` for the site so far has had `-p 8088:80` on it, because you were told to type it. Leave it off this once:

```shell
docker run --rm -d --name my-site my-site:3
```

Open <http://localhost:8088>. Nothing answers: the browser says the site cannot be reached, or refused to connect. Yet the web server inside is running. Ask Docker:

```shell
docker ps
```

```text
CONTAINER ID   IMAGE       COMMAND                  CREATED          STATUS          PORTS     NAMES
157a247515c0   my-site:3   "/docker-entrypoint.…"   10 seconds ago   Up 10 seconds   80/tcp    my-site
```

`Up`, and the `PORTS` column says `80/tcp`. That is the note `EXPOSE 80` left in your recipe: the program inside listens on port 80. It is only a note. A container has its own network the way it has its own filesystem, and the walls that kept `my-certs` out of `ls /` in lesson 1 keep your browser out of port 80 here. The server is listening, on a port that nothing outside the walls can reach.

**Now open a door.** Stop it, and start it the way the last lesson did:

```shell
docker stop my-site
docker run --rm -d -p 8088:80 --name my-site my-site:3
docker ps
```

```text
CONTAINER ID   IMAGE       COMMAND                  CREATED         STATUS         PORTS                                     NAMES
468fb0a12edd   my-site:3   "/docker-entrypoint.…"   3 seconds ago   Up 3 seconds   0.0.0.0:8088->80/tcp, [::]:8088->80/tcp   my-site
```

Reload <http://localhost:8088> and your page is back. Read the `PORTS` column this time: `0.0.0.0:8088->80/tcp`. That arrow is `-p 8088:80`, drawn out. **The left number is your computer's. The right number is the container's.** Port 8088 on your computer, which is the one your browser can reach, is forwarded to port 80 inside the container, which is the one the server listens on. `0.0.0.0` means every address your computer has, and the second entry is the same door for the newer kind of address. `docker port my-site` says the same thing on its own:

```shell
docker port my-site
```

```text
80/tcp -> 0.0.0.0:8088
80/tcp -> [::]:8088
```

**Now read your old file with that.** The `docker-compose.yml` from the deploy lesson had `"8443:443"` in it. Inside its container, the proxy's web server listens on 443, the standard port for https. You opened it on 8443 outside, because a port below 1024 needs administrator rights on your computer and 8443 does not. When you typed `https://localhost:8443`, you were knocking on the left number, and the proxy answered on the right one. It was always this.

**The mistake to recognise.** Getting the right-hand number wrong is the most common port error there is, and it is worth meeting once so you know its face. Stop the container and start it with a right-hand number that nothing inside listens on:

```shell
docker stop my-site
docker run --rm -d -p 8088:8080 --name my-site my-site:3
```

Reload the page. The browser does not say the site cannot be reached this time; it says the site sent no data, or reset the connection, which is a different complaint. The door on 8088 is open, since Docker opened it, and behind the door nobody is home on 8080. Whenever a container is `Up`, `docker ps` shows its port, and the browser still gets nothing, check the right-hand number against the `EXPOSE` line of the recipe, or against what the image's page on Docker Hub says it listens on. Step 5 of this lesson switches to an image that listens on 8080 rather than 80, and that number changes with it.

Stop it:

```shell
docker stop my-site
```

Tick this step when the page has answered with `-p 8088:80` and failed without it.
