<!-- Generated from docs/intake.md by kickoff v0.1.0. Edit the intake, not this file. -->

# 05: Verify an uploaded certificate

**What to build:** "As a student, I can upload my self-signed certificate for review and verification, so that the app confirms I applied the lesson correctly." From the user's side: the student pastes or uploads the certificate they generated in Task 03 (PEM), and the app shows what it found, the subject, the issuer, the validity dates, whether it chains to the root they made, and a verdict with what to fix when something is off.

**Blocked by:** 01, 02, 03.

**Status:** done. Merged to `main` through pull request #14 on 2026-09-07 with CI green.

## Steps, a vertical slice in this order

1. Schema: add `CertificateSubmission` (belongs to `LearningSession`; the certificate PEM; parsed subject, issuer, not-before, not-after; verdict; created at) in `prisma/schema.prisma`, then `pnpm prisma migrate dev --name certificate-submission`.
2. Data access: `pnpm add @peculiar/x509`. `src/lib/certificate.ts` with pure `parseCertificate` and `checkCertificate` functions, tested first against fixture PEMs under `src/lib/__fixtures__/` (a good leaf, an expired one, one signed by an unknown issuer, and a file that contains a private key). `src/lib/certificate-submission.ts` to store and list submissions, tested first.
3. Interface: `src/app/api/certificates/route.ts` (POST the PEM, size-limited) and `src/app/lessons/verify/page.tsx`.
4. Walk the story as the student would. Add the end-to-end test at `e2e/verify-a-certificate.spec.ts`.
5. Update `README.md` or `CLAUDE.md` if a command changed.

## Acceptance criteria

- [x] As a student, I can upload my certificate and see it checked: demonstrated end to end, by file or by paste.
- [x] Vitest covers the parse and check functions and the data-access functions as a caller would observe them, and passes. 24 new tests.
- [x] The end-to-end test passes: `e2e/verify-a-certificate.spec.ts`, five journeys.
- [x] Anything containing `PRIVATE KEY` is refused and never stored. Checked on the raw text before parsing, again before the write, and covered by a unit test and an end-to-end test (D55).
- [x] The migration is committed under `prisma/migrations/`: `20260907151118_certificate_submission`. The database was backed up first.
- [x] Every earlier test still passes locally. CI was green on pull request #14.
- [x] Any new environment variable is in `.env.example` with a placeholder. None was added.

## Suggested skills

- `tdd`: the parser and checker are pure functions with fixtures; write the tests first.
- `api-design` and `error-handling`: the upload route's limits and its messages for a person with no technical experience.
- `security-scan`: this route accepts a file from the user.

## Notes

7.2 says the app "might need" this. The intake's definition of done (14.1) requires it, so it is a must-have here. What "verified" means beyond a well-formed certificate that chains to the student's own root is not specified; write the checks down in the lesson so the student knows what passes.

## Notes from building it

Three deviations from the steps above, each recorded as a decision: Node's own
`crypto.X509Certificate` instead of `@peculiar/x509` (D54), a server action
instead of `src/app/api/certificates/route.ts` (D56), and one Vitest file at a
time now that two test files share the database (D57).

The finding that shaped the whole task: a file holding a certificate *and* a
private key parses perfectly well, because Node reads the first PEM block and
ignores the rest. Anything that treated a successful parse as proof of safety
would have written the key to the database. The refusal therefore runs on the
raw text, before parsing, and again before the write; and what is stored is
Node's re-encoding of the certificate, so text sent around the PEM block is not
kept either (D55).

What "verified" means is written down once, in `CERTIFICATE_CHECKS`, and the
page renders that list rather than a copy of it, so the page and the checks
cannot drift apart. The check worth understanding is the signature: a
certificate can name any issuer it likes, and only the signature settles it.

AgentShield was run per the `security-scan` skill and scored A (97/100), but it
audits agent configuration, not application code: it scanned one file and its
only finding was a `CLAUDE.md` permission bit that is meaningless on Windows.
It says nothing about this upload path. The review of that path was done by
hand and produced two changes: storing the canonical PEM, and a 64 kb
`serverActions.bodySizeLimit`.

The rate-limit wiring is now tested too. It could not be, at first: the
decision sat behind `await headers()`, which only works inside a request, and
that is the usual reason a limiter's wiring goes unchecked. Splitting the
decision out as `allowCertificateCheckFrom(userId, address)` makes it plain
input and plain output, following `clientAddressFrom` in `client-address.ts`.

That split also settled a question the original three lines answered by
accident. They were `a && b`, so once a student was over their own limit their
attempts stopped counting against the address. Both counters are now always
consulted: an attempt the student limit refuses was still an attempt from that
address. There is a test that fails if anyone puts the short circuit back.

`sign-in-limits.ts` still has the untested shape this one had, from Task 08.
