---
key: run
title: Run one, and read what happened
---

**Check Docker is there.** Open PowerShell on Windows, or Terminal on a Mac or Linux, and run:

```shell
docker --version
```

If you get a version number, carry on. If the word is not recognised, install **Docker Desktop** from [docker.com](https://www.docker.com/products/docker-desktop/), start it, and wait until it says it is running. It is a large download and it will ask to restart your computer. If it is installed but you get an error that mentions `connect` or `the Docker daemon`, Docker Desktop is not running: open it from the Start menu or your Applications folder, wait for the whale in the corner to stop moving, and try again.

**Run your first container.**

```shell
docker run hello-world
```

```text
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
...
Status: Downloaded newer image for hello-world:latest

Hello from Docker!
This message shows that your installation appears to be working correctly.

To generate this message, Docker took the following steps:
 1. The Docker client contacted the Docker daemon.
 2. The Docker daemon pulled the "hello-world" image from the Docker Hub.
 3. The Docker daemon created a new container from that image which runs the
    executable that produces the output you are currently reading.
 4. The Docker daemon streamed that output to the Docker client, which sent it
    to your terminal.
...
```

If you have run Docker on this computer before, the lines above the greeting may be missing and the greeting comes straight away: the image was already here. Read those lines anyway, because they are the whole idea. Docker looked on your computer for something called `hello-world`, did not find it, and **downloaded** it. Then it **started** it. The program inside printed a message. Then it **stopped**, because it had nothing else to do. Four things happened: download, start, print, stop.

The thing it downloaded is an **image**: a program packaged up with everything it needs already inside, which is why nothing had to be installed. The thing it started is a **container**: one run of that image. The rest of this lesson is about those two words, and by step 3 you will be able to tell them apart on sight.

The message calls the two halves of Docker the **client** and the **daemon**. The client is the `docker` command you typed. The daemon is the part that does the work, running in the background; on Windows and Mac it is what Docker Desktop starts. You will not need to think about the split again, but it explains the error you get when Docker Desktop is not running: the client is there, and has nobody to talk to.

**If you cannot install Docker Desktop on this machine.** A work laptop that will not let you install software is common, and the course still works from a browser. Two sites will give you a Linux machine with Docker already on it, in a browser tab, for free:

- [iximiuz Labs' Docker playground](https://labs.iximiuz.com/playgrounds/docker), with a free account. It is exactly that: a Linux machine with Docker installed and nothing else to do. The free plan allows **one hour of playground time per day**, which is enough for this lesson if you read it through before you start the clock.
- [Killercoda's Docker scenarios](https://killercoda.com/docker), also with a free account. Killercoda has no plain Docker playground, but every scenario on that page is a Linux machine with Docker on it: open any one, ignore its own instructions, and use its terminal. A session lasts **one hour**, after which the machine is deleted and you can start another; there is no daily limit.

A borrowed machine is wiped when its session ends, so anything on it goes with it; that is fine for this lesson, which cleans up after itself anyway. Those machines are Linux, so wherever a step gives two versions of a command, use the **Mac or Linux** one. The rest of this course works from a borrowed machine too, including the check at the end of it, which only needs text copied out of a terminal.

**If you are in a room of people doing this together.** Docker downloads images from **Docker Hub**, and Docker Hub counts downloads per internet address, not per person. An office or a classroom usually shares one address, so a room of people downloading at once can hit the limit together and see an error containing `toomanyrequests`. At the time of writing the limit is a hundred downloads every six hours for the whole address, and signing in with a free Docker account gives each person their own allowance of two hundred every six hours instead; [Docker's page on the limits](https://docs.docker.com/docker-hub/usage/) has the current numbers. To sign in, make an account at [hub.docker.com](https://hub.docker.com/), then click **Sign in** at the top of Docker Desktop, or run `docker login` and follow what it says. A borrowed machine from the panel above shares its address with everyone else using that site, so the same error is likelier there, and `docker login` on it is the same fix. On a connection of your own you will not get near the limit in this course.

Tick this step when `docker run hello-world` prints the greeting.
