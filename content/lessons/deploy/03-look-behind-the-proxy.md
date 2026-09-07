---
key: proxy
title: Look behind the reverse proxy
---

The page showing in your browser is worth reading properly, because it is not written by the server holding your certificate. It is written by a second, separate program sitting behind it, and the page is a description of the request as **that** program received it.

That arrangement is a **reverse proxy**. The proxy faces the world, holds the certificate, and speaks https. Everything behind it is ordinary, unencrypted, and unaware that any of this is happening. The proxy is where encryption stops, which is why people call it **terminating TLS**.

Look at your browser window. Among the lines you will see something like this:

```text
Hostname: a19f65a08196
RemoteAddr: 172.29.0.3:41904
GET / HTTP/1.1
Host: localhost
X-Forwarded-Proto: https
```

Four of those lines tell the story:

- **`Hostname`** is not your web server. It is the other program, the one called `backend` in your `docker-compose.yml`. Your browser has never spoken to it and cannot reach it.
- **`RemoteAddr`** is who the request appears to come from, and it is not your browser. It is the proxy. As far as the backend is concerned, the proxy is the visitor.
- **`GET / HTTP/1.1`** is plain, unencrypted http. The encryption ended at the proxy. Behind it, nothing is encrypted at all.
- **`X-Forwarded-Proto: https`** is the proxy leaving a note. The backend cannot tell that the original request was encrypted, so the proxy tells it. That is the line you wrote into `nginx.conf` in step 1.

You can watch the same request from the other side. Run this, then reload the page in your browser:

```shell
docker compose logs --tail 5 proxy
```

Each reload adds a line recording the request as the proxy saw it arrive.

**Why anyone does this.** Certificates expire, need renewing, and have to be kept secret. A reverse proxy means exactly one program deals with all of that, and everything behind it is spared. Put ten services behind one proxy and you have one certificate to look after rather than ten, and none of those ten needs to know what a certificate is. It is also why the certificate in step 1 was mounted read-only into the proxy and nowhere else: the backend has no business seeing your private key, so it never gets it.

This is the shape of most websites you use. Something at the edge holds the certificate, and the thing that actually answers you is somewhere behind it, speaking plain http on a private network.

Tick this step when you have found `X-Forwarded-Proto: https` on the page and understand why the backend needed to be told.
