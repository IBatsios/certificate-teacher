---
key: https
title: Put your certificate in front of it
---

Everything in this course has been setup for this step. Your image runs as an ordinary user, on a port you understand, and can say whether it is working. The certificates course left you a proxy that speaks https with a certificate you signed. This step puts the two in one file, and opens the result in your browser.

**Two things to check before you start.** Both stop this step before it begins, and both are easier to fix now than to meet as an error.

**First, port 8443.** If the website from the deploy lesson is still running, since this morning or since months ago, it holds that port, and the proxy you are about to start cannot have it. Ask Docker who has it:

```shell
docker ps --filter publish=8443
```

A row named `my-certs-proxy-1` is the deploy lesson's proxy. Go to its folder, stop it, and come back:

```shell
cd ../my-certs
docker compose down
cd ../my-site
```

Nothing but the header means the port is free.

**Second, the certificate.** The file below expects `my-certs` next to `my-site`, with `localhost.crt` and `localhost.key` in it, where the certificates course left them. **If that folder is gone**, or you never did that course, make the files again before going on: [steps 2 to 4 of the certificates lesson](/lessons/certificates#step-openssl) make a root and a leaf in about ten minutes, in a `my-certs` folder in your home folder, which is next to `my-site`. A new root is a new root, so then [tell your browser to trust it](/lessons/deploy#step-browser), as the deploy lesson explains, even if you did that once for an older one. Then come back here.

**Write the proxy's configuration.** In `my-site`, create a file called `proxy.conf` containing exactly this:

```file
server {
    listen 443 ssl;
    server_name localhost;

    ssl_certificate     /etc/nginx/certs/localhost.crt;
    ssl_certificate_key /etc/nginx/certs/localhost.key;

    location / {
        proxy_pass http://site:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

It is the `nginx.conf` from the deploy lesson with one line changed. `proxy_pass http://backend:80` has become `proxy_pass http://site:8080`, and you can now read every part of that: `site` is a name on a network, from step 4, and `8080` is the port your image listens on inside its container, from step 5.

**Write the start-up file.** Create `docker-compose.yml` in `my-site`, containing exactly this. Indentation matters in this kind of file, so keep the spacing as it is:

```file
services:
  site:
    image: my-site:4
  proxy:
    image: nginx:alpine
    ports:
      - "8443:443"
    volumes:
      - ./proxy.conf:/etc/nginx/conf.d/default.conf:ro
      - ../my-certs/localhost.crt:/etc/nginx/certs/localhost.crt:ro
      - ../my-certs/localhost.key:/etc/nginx/certs/localhost.key:ro
    depends_on:
      site:
        condition: service_healthy
```

Read it against the deploy lesson's file, which you can now read in full:

- **`site`** is your image, version 4. It has no `ports:` line, so it has no door to your computer at all; nothing outside the network Compose is about to make can reach it, which is where a thing behind a proxy belongs (step 4).
- **`proxy`** is the same web server as before, with the same one door: `8443` on your computer to `443` inside (step 1).
- The three **`volumes:`** lines are bind mounts, read-only (step 2). Your certificate and key are reached where they are, in `my-certs`, with `..` meaning the folder above this one. They are not copied here, so they are not in this folder for `COPY .` to gather; and `.dockerignore` keeps `proxy.conf` and this file out of your image as well.
- **`depends_on`** with **`condition: service_healthy`** tells Compose not to start the proxy until your site has passed its health check (step 5). Before the check, Compose could only wait for the site to be running. Now it waits for it to be working.

Neither file mentions a network, and neither needs to: Compose makes one, `my-site_default`, and puts both containers on it under the names in the file.

**Start it.**

```shell
docker compose up -d
```

```text
[+] Running 3/3
 ✔ Network my-site_default    Created
 ✔ Container my-site-site-1   Healthy
 ✔ Container my-site-proxy-1  Started
```

Read the middle line. Compose started your site, waited for its health check to pass, and only then started the proxy. `docker compose ps` shows the two: your site `(healthy)` with `8080/tcp` and no arrow, and the proxy with `0.0.0.0:8443->443/tcp`.

**If it stops with `port is already allocated`** instead, something holds 8443 after all. `docker ps --filter publish=8443` names it if it is a container, and the fix is the one at the top of this step. If nothing is listed, it is not Docker: some other program on your computer has the port, so change `"8443:443"` to `"8444:443"` in the file, run `docker compose up -d` again, and read `8444` wherever this step says `8443`.

**Open it.** <https://localhost:8443>. Your page, with your name on it. In the address bar, a padlock. Click the padlock and read what your browser says: the connection is secure, and the certificate was issued to `localhost` by **My Root**.

Take a moment over what that is. The page was built from a recipe you wrote, by a program you chose, into an image you tagged and signed. It is running as an ordinary user, on a network with no door, behind a proxy that holds a certificate you made, signed by a root you made, which your browser trusts because you told it to. Every part of that sentence was a step in one of these two courses, and none of it was handed to you by anybody else.

**If the browser shows a warning instead.** Three are likely, and each has been met before.

- `NET::ERR_CERT_AUTHORITY_INVALID`, or `Potential Security Risk Ahead`, is the warning from step 1 of the deploy lesson: this browser, or this computer, has not been told about your root. [Step 2 of the deploy lesson](/lessons/deploy#step-browser) is the fix, and it works exactly as it did there.
- `NET::ERR_CERT_DATE_INVALID` means the leaf certificate has expired; the certificates course gave it a little over two years. [Step 4 of the certificates lesson](/lessons/certificates#step-leaf) makes a new one, signed by the same root, so nothing needs trusting again. Then `docker compose down` and `docker compose up -d` here, because the proxy reads the file when it starts.
- The site cannot be reached at all, though `docker compose up` said `Started`. Run `docker compose ps`: if the proxy is `Exited`, then `docker compose logs proxy` will end with `cannot load certificate`. The certificate file was not where the start-up file said when you started, and Docker, finding nothing there, made an empty folder called `localhost.crt` in `my-certs` in its place. Delete that folder, put the real files there, or make them as described at the top of this step, and run `docker compose up -d` again.

**Watch a request go through.** Reload the page, then read the two logs:

```shell
docker compose logs --tail 3 proxy
docker compose logs --tail 3 site
```

The proxy's log has your browser's request, `GET / HTTP/1.1`, arriving over https. The site's log has the same request a moment later, from the proxy's address rather than yours, on plain http, with the health checks from `Wget` every ten seconds around it. That is the deploy lesson's picture of encryption stopping at the proxy, drawn again with a backend you built.

**Stop it, or leave it up.** `docker compose down` stops both containers and removes the network. `docker compose up -d` brings it all back in a few seconds, which is what the deploy lesson's file was quietly doing for you all along. The check at the end of this course, when it is ready, will ask for the description of a running container, and this is the one to have running.

Tick this step when <https://localhost:8443> shows your page with a padlock.
