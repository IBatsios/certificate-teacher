---
key: leaf
title: Make a certificate for localhost, signed by your root
---

The **leaf** is the certificate a website shows. Yours is for the name `localhost`, which is what your own computer calls itself. Making it takes three short moves: make a key and a request, write down the name the certificate is for, and have your root sign it.

**1. Make the key and the request.** A request says "please sign this key for this name". Same command in PowerShell and Terminal:

```shell
openssl req -newkey rsa:2048 -nodes -keyout localhost.key -out localhost.csr -subj "/CN=localhost"
```

**2. Write down the name.** Browsers ignore the common name and only trust a field called the **subject alternative name**. It goes in a one-line file. This is the one place the two systems differ.

Windows, in PowerShell:

```powershell
Set-Content localhost.ext "subjectAltName=DNS:localhost"
```

Mac or Linux, in Terminal:

```bash
printf "subjectAltName=DNS:localhost\n" > localhost.ext
```

**3. Sign it with your root.** Same command in both:

```shell
openssl x509 -req -in localhost.csr -CA my-root.crt -CAkey my-root.key -CAcreateserial -out localhost.crt -days 825 -extfile localhost.ext
```

What the parts mean:

- `-req -in localhost.csr` reads the request from step 1.
- `-CA my-root.crt -CAkey my-root.key` signs it with your root. This is the moment the chain forms.
- `-CAcreateserial` gives the certificate a serial number and remembers it in `my-root.srl`.
- `-days 825` gives it a little over two years. Public certificate authorities are held to far shorter lives these days, but that rule is for roots the whole world trusts, not for one you made yourself.
- `-extfile localhost.ext` adds the name from step 2.

The command prints `Certificate request self-signature ok` and the subject. Your folder now holds `localhost.key`, `localhost.crt`, and a few helper files.

Tick this step when `localhost.crt` exists.
