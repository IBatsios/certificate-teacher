---
key: browser
title: Tell your browser to trust your root, and watch the padlock appear
---

Your browser keeps a list of roots it trusts. It ships with about a hundred and fifty of them, belonging to the certificate authorities of the world, and it accepts a certificate only when it can trace a signature back to one of them. Yours is not on that list, so the chain leads nowhere and the browser stops.

Adding your root to that list is the fix. This is exactly what a company does on its own laptops so internal sites work, and it is the one step in this course you should think twice about outside a lesson: anything signed by a root you trust will be accepted silently, so a root is only ever worth trusting if you made it and you kept the key.

This is the fiddliest step in the course, because every browser keeps its list in a different place. Find yours below.

**Windows, for Chrome and Edge.** These two use the list Windows keeps. In File Explorer, open your `my-certs` folder and double-click `my-root.crt`. Click **Install Certificate**, choose **Current User**, then **Next**. Choose **Place all certificates in the following store**, click **Browse**, pick **Trusted Root Certification Authorities**, then **Next** and **Finish**. Windows shows a security warning describing the certificate; that warning is the one you are meant to read, and this is the one time you should agree to it. Click **Yes**.

If you prefer one command, this does the same thing and shows the same warning:

```powershell
Import-Certificate -FilePath my-root.crt -CertStoreLocation Cert:\CurrentUser\Root
```

**Mac, for Safari and Chrome.** Double-click `my-root.crt` to open Keychain Access. Find **My Root** in the **login** keychain, double-click it, expand the **Trust** section, and set **When using this certificate** to **Always Trust**. Close the window; macOS asks for your password to confirm.

**Linux, for Chrome.** Chrome keeps its own list in a small database. Install the tool that edits it, then add your root:

```bash
sudo apt install libnss3-tools
certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n "My Root" -i my-root.crt
```

**Firefox, on every system.** Firefox is the one worth understanding rather than just following. It does not read the list your operating system keeps at all. It ships its own, stored in a small database inside your Firefox profile folder, and consults only that. So trusting your root in Windows or on a Mac does nothing whatsoever for Firefox, and a root trusted in Firefox does nothing for Chrome. It is kept per profile, too, so a second Firefox profile will not know about it either.

This is why the same page can show a padlock in one browser and a warning in another on the same computer, with the same certificate. Nothing is broken when that happens; you have simply told one list and not the other.

Open **Settings**, search for `certificates`, and click **View Certificates**. On the **Authorities** tab click **Import**, choose `my-root.crt`, tick **Trust this CA to identify websites**, and click **OK**.

**Now close your browser completely and open it again.** Not just the tab: browsers read the trust list at start-up, and this is the most common reason this step appears not to work.

Go back to <https://localhost:8443>.

The warning is gone and there is a **padlock** in the address bar. Click it, then look at the connection details: your browser will tell you the connection is secure and that the certificate was issued to `localhost` by **My Root**. That name is yours. You made it in the last lesson, your computer now trusts it, and a certificate it signed is being accepted on its word.

Nothing about the certificate changed between the warning and the padlock. The only thing that changed is who your browser trusts.

**If the warning is still there.** Two things cause this nearly every time.

The first is the browser: closing the tab is not enough, and on Windows Chrome often keeps running in the background after the window is shut. Quit it from the system tray, or run `Get-Process chrome | Stop-Process` in PowerShell, then open it again.

The second is subtler, and it catches people who have been through the first lesson more than once. Every run of that lesson makes a **brand new root**, and every one of them is called `My Root`. The name is only a label. Trusting an older root does nothing at all for a certificate signed by a newer one, so your browser can show `My Root` in its trusted list and still refuse the page. Check whether the root in this folder is the one your computer trusts by comparing fingerprints, which are unique to each certificate in a way the name is not.

Windows, in PowerShell:

```powershell
openssl x509 -in my-root.crt -noout -fingerprint -sha1
Get-ChildItem Cert:\CurrentUser\Root | Where-Object { $_.Subject -eq 'CN=My Root' } | Select-Object Thumbprint, NotAfter
```

Mac or Linux, in Terminal:

```bash
openssl x509 -in my-root.crt -noout -fingerprint -sha1
```

then find `My Root` in Keychain Access, or in Firefox's certificate list, and read its SHA-1 fingerprint.

The two strings of digits should be the same once you ignore the colons in the first one. If they differ, the root in this folder is not the one being trusted: import it with the steps above, and delete the older entry so you are not left guessing which is which later.

Tick this step when you see the padlock at <https://localhost:8443>.
