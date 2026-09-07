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

**Firefox, on every system.** Firefox ignores the lists above and keeps its own. Open **Settings**, search for `certificates`, and click **View Certificates**. On the **Authorities** tab click **Import**, choose `my-root.crt`, tick **Trust this CA to identify websites**, and click **OK**.

**Now close your browser completely and open it again.** Not just the tab: browsers read the trust list at start-up, and this is the most common reason this step appears not to work.

Go back to <https://localhost:8443>.

The warning is gone and there is a **padlock** in the address bar. Click it, then look at the connection details: your browser will tell you the connection is secure and that the certificate was issued to `localhost` by **My Root**. That name is yours. You made it in the last lesson, your computer now trusts it, and a certificate it signed is being accepted on its word.

Nothing about the certificate changed between the warning and the padlock. The only thing that changed is who your browser trusts.

Tick this step when you see the padlock at <https://localhost:8443>.
