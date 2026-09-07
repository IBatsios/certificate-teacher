---
key: java
title: Teach Java to trust your root
---

You trusted your root in step 2, and your browser was satisfied. Java was not. Java ignores the list your operating system keeps and carries its own, in a file of its own format called a **keystore**. A keystore used for deciding who to trust is usually called a **truststore**, and Java ships with one full of the same public authorities your browser knows about. Yours is not in it.

This catches people out constantly. A site works in the browser, the same site fails from a Java program on the same machine, and nothing about the certificate is wrong. The two are simply reading different lists.

**Check Java is there.** Your site from step 1 should still be running.

```shell
java -version
```

If the word is not recognised, install a JDK: `winget install Microsoft.OpenJDK.21` on Windows, `brew install openjdk` on a Mac, or `sudo apt install default-jdk` on Linux. Then open a new window and try again.

**Write a program that connects.** In your `my-certs` folder, create a file called `TrustCheck.java` containing exactly this:

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class TrustCheck {
    public static void main(String[] args) throws Exception {
        HttpResponse<String> response = HttpClient.newHttpClient().send(
            HttpRequest.newBuilder(URI.create("https://localhost:8443/")).build(),
            HttpResponse.BodyHandlers.ofString());
        System.out.println("Connected. HTTP " + response.statusCode());
    }
}
```

It asks for the same page your browser is showing, and prints the result.

**Watch it fail.** Java can run a single file directly, without compiling it first:

```shell
java TrustCheck.java
```

It stops with a wall of red text. The line that matters is near the top:

```text
javax.net.ssl.SSLHandshakeException: (certificate_unknown) PKIX path building failed:
sun.security.provider.certpath.SunCertPathBuilderException: unable to find valid
certification path to requested target
```

**`unable to find valid certification path to requested target`** is worth remembering. It is one of the most-searched error messages in Java, and it almost never means what people first assume. It is not saying your certificate is invalid. It is saying Java followed the chain upwards, arrived at **My Root**, looked for it in its own list, and did not find it. It is the same complaint your browser made in step 1, in different words.

**Make a truststore holding your root.** `keytool` comes with Java and edits keystores:

```shell
keytool -importcert -alias my-root -file my-root.crt -keystore my-truststore.p12 -storetype PKCS12 -storepass changeit -noprompt
```

It answers:

```text
Certificate was added to keystore
```

What the parts mean:

- `-importcert -file my-root.crt` is the certificate going in. Your root, not your leaf: Java needs to know who to trust, not which site you are visiting.
- `-alias my-root` is a label, so you can find or remove it later.
- `-keystore my-truststore.p12` is the file to create. It did not exist, so `keytool` makes it.
- `-storetype PKCS12` is the modern, portable keystore format. Java's older `JKS` format still turns up in the wild and produces a warning telling you to migrate.
- `-storepass changeit` is the password on the file. `changeit` is the traditional default and is genuinely what Java's own truststore ships with. Fine for a lesson; choose something real for anything else.
- `-noprompt` skips the "trust this certificate?" question, which you already answered by running the command.

**Run it again, with the truststore.** Two settings tell Java to use your file instead of its own. Keep the quotation marks exactly where they are:

```shell
java "-Djavax.net.ssl.trustStore=my-truststore.p12" "-Djavax.net.ssl.trustStorePassword=changeit" TrustCheck.java
```

The quotes are not decoration. Without them PowerShell breaks each setting apart at the first full stop and hands Java the fragment `.net.ssl.trustStore=my-truststore.p12` as though it were the name of a program to run, and you get `Could not find or load main class`. The quotes keep each setting in one piece. They do no harm on a Mac or Linux, which is why the line is written this way for everyone.

```text
Connected. HTTP 200
```

Nothing changed about the server, the certificate, or the program. The only difference is the list Java checked. That is the whole idea of a chain: trust is decided by what you have chosen to believe in, not by anything contained in the certificate itself.

**Clean up.** When you are finished, this stops the website and removes both programs:

```shell
docker compose down
```

Your certificates stay where they are. If you would rather your computer stopped trusting your root, remove it the same way you added it in step 2: on Windows through **Manage user certificates**, on a Mac through Keychain Access, and in Firefox through **View Certificates**.

Tick this step when Java prints `Connected. HTTP 200`.
