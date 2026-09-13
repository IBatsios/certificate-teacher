---
key: inside
title: Get inside one
---

`hello-world` stopped the moment it had printed. This time you will start a container that waits for you, and go inside it.

```shell
docker run -it alpine sh
```

`alpine` is a tiny Linux, a few megabytes where Windows or macOS is many gigabytes, and it is popular as a starting point precisely because it is so small. `sh` is the program you are asking it to run: a command prompt. The `-it` is what makes it interactive; without it, Docker would start the prompt, see that nobody was typing, and stop. Your own prompt changes to `/ #`, and from here on you are typing **inside the container**.

**If your prompt did not change** and you got an error saying `stdin is not a terminal` or `the input device is not a TTY` instead, you are running the command from somewhere that is not a real terminal window, such as an editor's output panel. Open PowerShell or Terminal itself and run it there. If you are using Git Bash on Windows, it has this problem too: put `winpty ` in front of the command, or use PowerShell for this step. Do not go on until you can see `/ #`; the next three commands are meant for the container, and typed into your own computer they do something else.

Have a look around. Type these one at a time, at the `/ #` prompt:

```container
ls /
```

```text
bin    etc    lib    mnt    proc   run    srv    tmp    var
dev    home   media  opt    root   sbin   sys    usr
```

That is a filesystem, and it is not your computer's. There is no `C:\Users`, no `Documents`, no `my-certs`. It is the filesystem that came inside the `alpine` image, and nothing else. The names may be arranged differently in your window; the names are what matter.

```container
ps
```

```text
PID   USER     TIME  COMMAND
    1 root      0:00 sh
    8 root      0:00 ps
```

`ps` lists running programs. On your computer that list runs to hundreds. In here there are two: the prompt you are typing at, and `ps` itself, whose number may differ from the one shown. Everything else on your computer, from your browser to Docker Desktop, is invisible from inside.

**That is what a container is.** A program running with its own view of the filesystem and its own list of processes, walled off from the machine it is on. It is not a separate computer and it is not a virtual machine: it is one ordinary program on a Linux system, with the walls put up around it by that system. That is why it starts in under a second, and why it can be thrown away without a trace. On Windows and Mac, Docker Desktop quietly keeps a small Linux running for the purpose, which is why `ls /` showed you Linux folders on a Windows machine.

Leave the room:

```container
exit
```

Your own prompt comes back. Now ask Docker what is running:

```shell
docker ps
```

```text
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
```

Nothing. The program you were inside was `sh`, you told it to exit, and a container lives exactly as long as its program does. The moment `sh` ended, the container stopped. It is not quite gone, though, and the next step shows where it went.

**If two rows appear here instead**, named `my-certs-proxy-1` and `my-certs-backend-1` and marked `Up`, they are the website from the deploy lesson, still running because `docker compose down` was never run at the end of it. Nothing is wrong, but the counts in the next three steps assume it has been stopped, so stop it now. Go to the folder the deploy lesson used and run:

```shell
cd my-certs
docker compose down
```

Then `docker ps` shows nothing, and you can carry on from here.

Tick this step when you have run `ps` inside the container and seen a list of two.
