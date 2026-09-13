---
key: dockerfile
title: A Dockerfile is a recipe
---

**Make a folder for the site.** Open a fresh PowerShell on Windows, or Terminal on a Mac or Linux. It starts in your home folder, the same place `my-certs` is, and the new folder goes next to it:

```shell
mkdir my-site
cd my-site
```

**Write the page.** Create a file called `index.md` in that folder, containing this, with your own name in place of `Your Name`:

```file
# Your Name's website

This page is served by a container I built myself.
```

That is **Markdown**: plain text with a few marks in it, where `#` at the start of a line makes a heading. The lessons you are reading were written the same way. A program will turn it into a web page in a moment.

**Two things about saving files that catch people out.** Notepad adds `.txt` to whatever name you give it unless you change **Save as type** to **All files**, or put the name in quotes: `"index.md"`. TextEdit on a Mac saves formatted text unless you first choose **Make Plain Text** from its Format menu. Both matter for the next file, which has no extension at all.

**Write the recipe.** Create a second file called `Dockerfile`, no extension, containing exactly this:

```file
FROM nginx:alpine
COPY . /site/
RUN apk add --no-cache pandoc-cli
RUN pandoc /site/index.md --standalone --metadata pagetitle="My website" --output /usr/share/nginx/html/index.html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

One line at a time, top to bottom, which is the order Docker reads it in:

- **`FROM nginx:alpine`**: start from this image. Every recipe starts from an image somebody already made, and this is the web server from the deploy lesson, on the tiny Linux you had a prompt inside last lesson.
- **`COPY . /site/`**: copy files from your computer into the image. `.` is this folder, the one you are standing in; `/site/` is where they go inside.
- **`RUN apk add --no-cache pandoc-cli`**: run a command inside the image while it is being built. `apk` is the installer on that tiny Linux, the way `winget` is on Windows, and `pandoc` is the program that turns Markdown into a web page. `--no-cache` tells the installer not to keep its own downloads afterwards.
- **`RUN pandoc ...`**: turn your `index.md` into `index.html`, in the folder nginx serves pages from. `--standalone` makes it a complete page, and `pagetitle` is what the browser tab will say.
- **`EXPOSE 80`**: a note that the web server inside listens on port 80. It opens nothing by itself; the next lesson is about ports.
- **`CMD [...]`**: what runs when a container is started from this image. The nginx image already ends with exactly this line, so you could leave it out; it is here so that the recipe says everything.

**Build it.**

```shell
docker build -t my-site:1 .
```

`-t my-site:1` is the name to give the result, with `:1` for version one, and the `.` at the end means build from here, this folder. The first build installs the converter, which takes fifteen to twenty seconds, and prints a line for each step:

```text
[+] Building 18.5s (10/10) FINISHED
 => [internal] load build definition from Dockerfile
 => [internal] load metadata for docker.io/library/nginx:alpine
 => [internal] load .dockerignore
 => [1/4] FROM docker.io/library/nginx:alpine@sha256:...
 => [internal] load build context
 => [2/4] COPY . /site/
 => [3/4] RUN apk add --no-cache pandoc-cli
 => [4/4] RUN pandoc /site/index.md --standalone --metadata pagetitle="My w
 => exporting to image
 => => naming to docker.io/library/my-site:1
```

Yours has times on the right and long numbers where the dots are. The four numbered steps are your `FROM`, `COPY`, `RUN`, and `RUN`; `EXPOSE` and `CMD` change nothing in the files, so they are not counted.

**If it ends in an error instead.** The message is near the bottom, after the word `ERROR`, and these are the likely ones:

- `failed to read dockerfile: open Dockerfile: no such file or directory` means the file is not called `Dockerfile`, usually because it was saved as `Dockerfile.txt`. Run `ls` to see the name, then rename it: `Rename-Item Dockerfile.txt Dockerfile` in PowerShell, or `mv Dockerfile.txt Dockerfile` in Terminal.
- `error during connect` or `Cannot connect to the Docker daemon` means Docker Desktop is not running, as in step 1 of the last lesson.
- An error at step `[3/4]` mentioning `unable to select packages` or `temporary error` means the installer inside could not reach the internet. Check your connection and run the build again; on an office network that blocks unknown sites, ask for `dl-cdn.alpinelinux.org` to be allowed.
- `toomanyrequests` is the Docker Hub limit from the last lesson, and signing in is the fix.

**Run it.**

```shell
docker run --rm -d -p 8088:80 --name my-site my-site:1
```

Four new things on that line, each doing one job. `-d` runs it in the background and gives you your prompt back. `-p 8088:80` opens a door from your computer's port 8088 to the container's port 80, the one `EXPOSE` mentioned; the next lesson is about this. `--name my-site` names the container, so that you can stop it by name instead of by a made-up one. `--rm` removes the container when it stops, so it does not pile up with the ones you cleaned up last lesson.

Now open <http://localhost:8088> in your browser. That is your page, with your name on it, served by a container built from a recipe you wrote.

**If the browser shows something else, or nothing.** Something on your computer is already using port 8088. Stop the container, start it again on another number, and open that instead:

```shell
docker stop my-site
docker run --rm -d -p 8089:80 --name my-site my-site:1
```

Then <http://localhost:8089>. If the error was `port is already allocated`, the something is another container; `docker ps` shows which. Use the same number in every later step of this lesson.

**Stop it** when you have seen the page. `--rm` means stopping is also removing, and `docker ps -a` will not list it afterwards.

```shell
docker stop my-site
```

Tick this step when your page, with your name on it, has appeared in your browser.
