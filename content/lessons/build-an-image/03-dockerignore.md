---
key: dockerignore
title: What got copied in, and how to keep a private key out
---

`COPY . /site/` copies everything in the folder. Look at what that meant:

```shell
docker run --rm my-site:1 ls /site
```

```text
Dockerfile
index.md
```

**If you use Git Bash on Windows** and the answer was `No such file or directory` with `C:/Program Files/Git` in it, Git Bash rewrote `/site` into a Windows path before Docker saw it. It does that to any word starting with a slash. Use PowerShell for this lesson, or type `//site`, with two slashes, wherever a command in this lesson has `/site`.

The recipe itself is inside the image. It does no harm there, and no good either, and it is the word _everything_ that matters. Docker gathers up the whole folder the moment a build starts, before it has read a single line of the recipe; the `load build context` line near the top of every build is that happening.

**This is the paragraph to remember.** Next door to `my-site` is `my-certs`, and in it is `localhost.key`: the private key from the certificates course, the one file in that whole course that must never leave your computer. It was not copied, because it is not inside `my-site`. But if you had made `my-site` inside `my-certs`, or copied the certificate files in here to have them handy, `COPY .` would have put your private key into the image, and it would be there for good. A file in a layer stays in that layer even if a later line deletes it, and anyone who gets the image gets the key. It is the same reason the certificate check in the other course refuses to accept a private key at all: the safe number of copies of a private key is one.

**See it happen, with something that is not a key.** Create a file called `notes.txt` in `my-site` containing one line:

```file
my password is hunter2
```

Build again, and ask the image for it:

```shell
docker build -t my-site:1 .
docker run --rm my-site:1 cat /site/notes.txt
```

```text
my password is hunter2
```

It is in the image. Nothing in the recipe mentioned it; it was in the folder, and the folder went in.

**Tell Docker what to leave out.** A file called `.dockerignore` in the same folder lists what the build must not gather. Its name starts with a dot, which some editors refuse to save, so make it from the terminal:

```powershell
Set-Content .dockerignore "*", "!index.md"
```

```bash
printf '*\n!index.md\n' > .dockerignore
```

Check it with `cat .dockerignore`, which prints the file in either shell:

```text
*
!index.md
```

Two lines: everything, except `index.md`. The `*` means every file, and a line starting with `!` takes something back out of the pile. Build again and look:

```shell
docker build -t my-site:1 .
docker run --rm my-site:1 ls /site
docker run --rm my-site:1 cat /site/notes.txt
```

```text
index.md
cat: can't open '/site/notes.txt': No such file or directory
```

Only the page went in. The notes stayed on your computer, and so would a key. Delete the notes; you never needed them:

```shell
rm notes.txt
```

When you add a second page or a picture to the site later, add a `!` line for it. Saying what goes in, rather than what stays out, is the safer way round: a new file you forgot about is left out rather than shipped. If you ever inherit a `.dockerignore` written the other way, with a list of things to exclude, the line to check for is `*.key`.

Tick this step when `ls /site` shows `index.md` and nothing else.
