---
key: site
title: Start a real https website on your computer
---

A certificate on its own does nothing. Something has to **serve** it: a web server that hands your certificate to the browser and proves it holds the matching private key. That is what you are about to start.

You will use **Docker**, which runs small pre-packaged programs without installing them properly. One command starts the whole website, and one command removes every trace of it later. It also means the instructions below are the same on Windows, Mac, and Linux.

**Check Docker is there.** Open PowerShell on Windows, or Terminal on a Mac or Linux, and run:

```shell
docker --version
```

If you get a version number, carry on. If the word is not recognised, install **Docker Desktop** from [docker.com](https://www.docker.com/products/docker-desktop/), start it, and wait for it to say it is running before trying again. It is a large download and it will ask to restart your computer.

**Go to your certificates.** Everything below expects the folder from the last lesson:

```shell
cd my-certs
```

**Write the web server's configuration.** This file tells the server which port to listen on, which certificate to present, and what to do with a request once it arrives. Create a file called `nginx.conf` in the folder, containing exactly this:

```text
server {
    listen 443 ssl;
    server_name localhost;

    ssl_certificate     /etc/nginx/certs/localhost.crt;
    ssl_certificate_key /etc/nginx/certs/localhost.key;

    location / {
        proxy_pass http://backend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

The two `ssl_` lines are the point of this whole course: they are where your certificate and your private key get put to work. The `proxy_pass` line is the reverse proxy, and step 3 comes back to it.

**Write the start-up file.** Create a second file called `docker-compose.yml`, containing exactly this. Indentation matters in this kind of file, so keep the spacing as it is:

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

Two programs are described here. `proxy` is the web server that holds your certificate. `backend` is a tiny website that answers every request by describing what it received, which is what makes step 3 possible. The `:ro` on each of your certificate files means read-only: the server can read them, and cannot change them.

**Start it.**

```shell
docker compose up -d
```

The first run downloads both programs and takes a minute. When it finishes, open <https://localhost:8443> in your browser.

**What happens next depends on your computer, and either answer is fine.**

**If your browser refuses to show the page**, that is the usual first-time result and it is the whole point of the next step. You will see a full-page warning saying the connection is not private, with a phrase like `NET::ERR_CERT_AUTHORITY_INVALID` or `Potential Security Risk Ahead`. Your certificate is being served perfectly; your browser has simply never heard of the root that signed it. Do not click through the warning. Step 2 removes it properly.

**If the page loads straight away** and shows a block of text about the request, your computer already trusts your root. That happens when you have been through this lesson before: nothing here ever removes a root once you have added one, so it stays trusted until you take it out yourself. Nothing is wrong. Read step 2 anyway, because it explains what that trust actually is and how to check that the root being trusted is the one in this folder rather than an older one with the same name.

Tick this step when <https://localhost:8443> answers at all, with either the warning or the page.
