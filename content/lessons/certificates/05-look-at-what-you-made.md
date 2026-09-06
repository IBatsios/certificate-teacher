---
key: verify
title: Look at what you made, and check the chain
---

Two commands show that the pair works the way the first step described.

**See the chain in two lines.** Same command in PowerShell and Terminal:

```shell
openssl x509 -in localhost.crt -noout -subject -issuer -dates
```

```text
subject=CN=localhost
issuer=CN=My Root
notBefore=...
notAfter=...
```

The subject is the leaf's name. The issuer is your root. That is the whole chain, and the two dates are when it starts and stops being valid.

**Check it the way a browser would.** `verify` follows the issuer to a root it has been told to trust. Here you tell it about yours:

```shell
openssl verify -CAfile my-root.crt localhost.crt
```

```text
localhost.crt: OK
```

`OK` means the leaf really was signed by that root and nothing has been tampered with.

**Now see what a browser sees today.** Run the same check without telling it about your root:

```shell
openssl verify localhost.crt
```

```text
CN=localhost
error 20 at 0 depth lookup: unable to get local issuer certificate
error localhost.crt: verification failed
```

The middle line is the complaint, and it is the same one your browser will make until it trusts your root. Fixing that, in the browser, behind a reverse proxy, and in Java, is the next lesson.

Keep the `my-certs` folder. Everything in it is needed next. Tick this step when `verify` with your root says `OK`.
