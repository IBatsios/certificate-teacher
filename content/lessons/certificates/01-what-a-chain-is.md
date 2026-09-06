---
key: chain
title: What a certificate chain is
---

A certificate is a small file that says: **this name belongs to this key**. A website shows its certificate to your browser so the browser knows it is talking to the real site and not an impostor.

The catch is that anyone can write a file like that. So every certificate is **signed** by another certificate, the one that vouches for it. That certificate is signed by another, and so on, until you reach one that signed itself. That last one is the **root**.

Read from the top down, the chain looks like this:

1. **The root.** Signed by itself. Your computer and your browser come with a short list of roots they trust, and you can add your own. This is the anchor: trust starts here or nowhere.
2. **The intermediate.** Signed by the root. Real certificate authorities keep the root's key locked away and let an intermediate do the everyday signing, so a stolen intermediate can be replaced without replacing the root.
3. **The leaf.** Signed by the intermediate, or by the root directly. This is the certificate for one name, like `www.example.com` or `localhost`. It is the one a website actually shows.

When your browser sees a leaf, it looks at who signed it, then who signed that, and keeps going. If the trail ends at a root the browser trusts, the padlock appears. If it ends anywhere else, you get a warning.

In this lesson you make a root and a leaf and skip the intermediate. Two certificates are enough to see how signing works, and the next lesson shows what happens when the browser does not know your root yet.

Tick this step when the three words **root**, **intermediate**, and **leaf** make sense to you.
