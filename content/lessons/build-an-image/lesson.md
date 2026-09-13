---
title: Build your own image
---

Everything you have run so far, somebody else made. `hello-world`, `alpine`, `nginx:alpine`, `traefik/whoami`: all downloaded, all someone's work. This lesson is where you make one. You will write a **Dockerfile**, the recipe an image is built from, and build a small website image with your own name on the page. Then you will watch Docker skip work it has already done, keep a private key out of your image, learn what a tag is and what `latest` is not, cut the image to a third of its size, and sign it so that the check at the end of this course can tell it is yours.

You need Docker Desktop running, as in the last lesson, and a text editor: Notepad on Windows or TextEdit on a Mac will do. The `my-certs` folder from the certificates course is not needed, but step 3 is about it, so leave it where it is. Work through the steps in order, and tick each one when it is done. Your progress is saved as you go.
