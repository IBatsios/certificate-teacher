---
key: networks
title: Networks, and how the proxy found the backend
---

In the deploy lesson, `nginx.conf` said `proxy_pass http://backend:80;`, and it worked: the proxy sent every request on to something called `backend`. Nothing on your computer is called that. This step is where the name came from.

**Make a network, and put your site on it.**

```shell
docker network create my-net
docker run --rm -d --network my-net --name web my-site:3
```

No `-p` this time, so from your browser it is unreachable, as in step 1. Now start a second container on the same network, and have it ask for the page by name:

```shell
docker run --rm --network my-net alpine sh -c "wget -qO- http://web | grep title"
```

```text
  <title>My website</title>
```

`wget` fetches a page, `-qO-` prints it rather than saving it, and `grep title` keeps the one line with the page's title in it. The address was `http://web`: the first container's name, and no port, because the site listens on 80 and 80 is what `http://` means. The second container found the first by name and got your page, with no door opened to your computer at all.

**Now try it from off the network.** The same command, without `--network`:

```shell
docker run --rm alpine sh -c "wget -qO- http://web | grep title"
```

```text
wget: bad address 'web'
```

The name means nothing here. Every network you create comes with a small phone book, and Docker writes each container's name into it as the container joins. A container on the network can look up any other by name; a container off it cannot, and neither can your computer. List what you have:

```shell
docker network ls
```

```text
NETWORK ID     NAME      DRIVER    SCOPE
a5f4a181df65   bridge    bridge    local
3ca4aba39632   host      host      local
1eb9d0dcbc1d   my-net    bridge    local
c9218395daed   none      null      local
```

The IDs are yours, and if you have used Compose on this computer there may be more rows, named after their folders. `bridge` is where a container goes when you say nothing, which is where every container in this course has been until now, and it is the reason the second `wget` failed twice over: `web` was on a different network, and the default one has no phone book anyway, so names never work on it. `host` and `none` are special cases you can leave alone.

**That is what Compose did for you.** `docker compose up` creates a network named after the folder, `my-certs_default`, and starts every container in the file on it, under the name the file gives it. So `proxy` could reach `backend` by name, and nothing else on your computer could reach either of them, except through the one door the file opened, `8443`. The backend was not hidden by any setting. It was on a network with no door, which is exactly where a thing behind a proxy belongs. `docker compose down` removes the network along with the containers, which is why it is not in the list above.

Stop the site and remove the network:

```shell
docker stop web
docker network rm my-net
```

Tick this step when `wget` has printed the title from inside the network and `bad address` from outside it.
