---
key: volumes
title: Volumes, and where a container's files go when it stops
---

In lesson 1 you saw that a container has its own filesystem. Here is the other half of that: it loses it, too. Write a file inside a container and let the container stop:

```shell
docker run --rm alpine sh -c "echo hello > /note.txt; cat /note.txt"
```

```text
hello
```

`sh -c` runs the quoted text as a command inside the container, where `>` writes the word into a file and `cat` reads it back. The file is there. Now start another container from the same image and ask for it:

```shell
docker run --rm alpine cat /note.txt
```

```text
cat: can't open '/note.txt': No such file or directory
```

Gone. The first container had the file, and the first container is gone: `--rm` removed it when it stopped, and a container's files go with it. Without `--rm` the file would be stuck inside a stopped container, and still no new container from the image would see it, because every container starts from the image's files and nothing else. That is right for a web server, whose page is in the image, and hopeless for a database, whose whole job is to keep what it is given.

**A volume is a folder that outlives the container.** Ask Docker for one by name, and put a file in it:

```shell
docker run --rm -v my-data:/data alpine sh -c "echo hello > /data/note.txt"
docker run --rm -v my-data:/data alpine cat /data/note.txt
```

```text
hello
```

Two containers, and the second reads what the first wrote. `-v my-data:/data` means: a volume called `my-data`, which Docker creates if there is none, shown inside the container as the folder `/data`. Both containers are gone, and the volume is not:

```shell
docker volume ls
```

```text
DRIVER    VOLUME NAME
local     my-data
```

Docker keeps a volume's files in a place of its own on your computer, and you are not meant to go looking for them; you reach them through a container, and they stay until `docker volume rm` says otherwise. That is how a database in a container survives being stopped, restarted, and upgraded: the program is in the image and is replaced freely, and the data is in a volume and is not.

**The other kind, which you have used already.** Instead of a name, the left side of `-v` can be a folder on your computer, and then the container sees that folder, not a copy of it. This is a **bind mount**. Try it with the site folder you are standing in; `${PWD}` means the folder you are in, in PowerShell and in Terminal alike, and the quotation marks keep a space in its name from breaking the line:

```shell
docker run --rm -v "${PWD}:/site:ro" alpine ls /site
```

```text
Dockerfile
index.md
```

Your folder, seen from inside a container as `/site`. Compare that with `COPY . /site/` in your Dockerfile, which put a _copy_ of the folder into the image while the image was being built, kept the rules in `.dockerignore`, and does not change when the folder does. A bind mount shows the folder itself, as it is right now: edit `index.md` on your computer and the container sees the edit at once.

**If you use Git Bash on Windows**, stop here and use PowerShell for the rest of this lesson. Git Bash rewrites any path beginning with a slash before Docker sees it, as lesson 2 warned, and on a `-v` line the rewrite is worse than a wrong path: it turns the whole thing into a Windows path list, Docker accepts it, nothing is mounted, and a stray folder called `my-site;C` appears next to your site, which you can delete. The `//` trick from lesson 2 does not help with `-v`. If you would rather stay in Git Bash, typing `MSYS_NO_PATHCONV=1` in front of a `docker` command turns the rewriting off for that one command.

**And what `:ro` buys.** Try to change a file through that mount:

```shell
docker run --rm -v "${PWD}:/site:ro" alpine sh -c "echo oops >> /site/index.md"
```

```text
sh: can't create /site/index.md: Read-only file system
```

Refused. `:ro` is read-only: the container can read the folder and cannot write to it, whatever the program inside tries. Without the `:ro`, that command would have added a line to the `index.md` on your computer, because the folder is your folder.

Now read the deploy lesson's file one more time:

```text
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./localhost.crt:/etc/nginx/certs/localhost.crt:ro
      - ./localhost.key:/etc/nginx/certs/localhost.key:ro
```

Three bind mounts, one file each, all read-only. Your certificate and your private key were never copied into an image, or into Docker at all. The proxy was shown the files where they lay, in `my-certs`, and could not change them, and when `docker compose down` removed the proxy nothing happened to the files, because nothing ever had. Lesson 2 was about keeping a private key out of an image; this is the other half of that lesson, the right way to hand a program a secret file. Mount it, read-only, into the one container that needs it. It is in no image and no volume, and it stays exactly where you can see it.

Remove the volume; you will not need it again:

```shell
docker volume rm my-data
```

Tick this step when a second container has read `hello` from the volume, and the read-only mount has refused a write.
