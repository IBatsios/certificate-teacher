# Certificate fixtures

Generated once with OpenSSL 3.5.7 and committed, so the tests need no OpenSSL
and give the same answer on every machine.

| File               | What it is                                                                    |
| ------------------ | ----------------------------------------------------------------------------- |
| `good-root.crt`    | A self-signed root, `CN=My Root`, exactly what the certificates lesson makes  |
| `good-leaf.crt`    | `CN=localhost` with `subjectAltName=DNS:localhost`, signed by `good-root.crt` |
| `expired-leaf.crt` | The same leaf, signed by the same root, valid 2020 to 2021                    |
| `foreign-leaf.crt` | A `CN=localhost` leaf signed by `other-root.crt`, not by the student's root   |
| `other-root.crt`   | A second self-signed root, `CN=Someone Elses Root`                            |

The good certificates run to 2126. That is deliberate: a fixture that expires
turns a passing test into a failing one years later, for no reason a reader
would understand.

**No private keys live here.** The tests that cover refusing a private key, and
refusing a certificate with a key concatenated after it, build that text in the
test file from a synthetic PEM block. Committing real key material to a public
repository, even throwaway material, trains people to ignore the warning that
matters.

To regenerate, see the commands in `docs/DECISIONS.md` under D54.
