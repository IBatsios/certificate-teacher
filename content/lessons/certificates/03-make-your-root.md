---
key: root
title: Make your root certificate
---

Your root is the certificate you will later tell your browser and Java to trust. It comes as two files: a **private key**, which must stay on your computer and never be shared, and the **certificate**, which is public and gets handed around.

One command makes both. It is the same in PowerShell and in Terminal:

```shell
openssl req -x509 -newkey rsa:2048 -nodes -keyout my-root.key -out my-root.crt -days 3650 -subj "/CN=My Root"
```

What the parts mean:

- `req -x509` asks for a certificate that signs itself. That is the definition of a root.
- `-newkey rsa:2048` makes a fresh private key at the same time.
- `-nodes` leaves the key without a password. Fine for a lesson; a real root would have one.
- `-keyout my-root.key` and `-out my-root.crt` name the two files.
- `-days 3650` makes it valid for ten years.
- `-subj "/CN=My Root"` is the name on the certificate. `CN` is short for common name.

The command prints a few lines about the key and finishes without asking anything. Now look at what it made:

```shell
openssl x509 -in my-root.crt -noout -subject -issuer
```

You should see two lines, and they say the same thing:

```text
subject=CN=My Root
issuer=CN=My Root
```

The **subject** is who the certificate is for. The **issuer** is who signed it. When they match, the certificate signed itself, which is exactly what makes it a root. On a Mac the spacing may differ a little, such as `subject= /CN=My Root`; the names are what matter.

Tick this step when the folder holds `my-root.key` and `my-root.crt`.
