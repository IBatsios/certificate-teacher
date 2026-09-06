---
key: openssl
title: Check that OpenSSL is on your computer
---

**OpenSSL** is the standard tool for making and reading certificates. Every command in this lesson uses it. First make sure it is there.

**Windows.** Open PowerShell: press the Windows key, type `PowerShell`, and open it. Then run:

```powershell
openssl version
```

If PowerShell says the word is not recognized, install OpenSSL and try again in a **new** PowerShell window:

```powershell
winget install ShiningLight.OpenSSL.Light
```

If it is still not recognized after that, Git for Windows ships its own copy. This line makes it available for the current window only:

```powershell
$env:Path += ";C:\Program Files\Git\usr\bin"
```

**Mac or Linux.** Open Terminal and run:

```bash
openssl version
```

On a Mac the answer may start with `LibreSSL` instead of `OpenSSL`. That is fine for this lesson.

Now make a folder to keep the lesson's files together, and go into it. The same two commands work in PowerShell and in Terminal:

```shell
mkdir my-certs
cd my-certs
```

Stay in this folder for the rest of the lesson. Every later command expects to find the files it makes right here.

Tick this step when `openssl version` prints a version number.
