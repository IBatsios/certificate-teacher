<!-- Generated from docs/intake.md by kickoff v0.1.0. Edit the intake, not this file. -->

# 05: Verify an uploaded certificate

**What to build:** "As a student, I can upload my self-signed certificate for review and verification, so that the app confirms I applied the lesson correctly." From the user's side: the student pastes or uploads the certificate they generated in Task 03 (PEM), and the app shows what it found, the subject, the issuer, the validity dates, whether it chains to the root they made, and a verdict with what to fix when something is off.

**Blocked by:** 01, 02, 03.

**Status:** ready

## Steps, a vertical slice in this order

1. Schema: add `CertificateSubmission` (belongs to `LearningSession`; the certificate PEM; parsed subject, issuer, not-before, not-after; verdict; created at) in `prisma/schema.prisma`, then `pnpm prisma migrate dev --name certificate-submission`.
2. Data access: `pnpm add @peculiar/x509`. `src/lib/certificate.ts` with pure `parseCertificate` and `checkCertificate` functions, tested first against fixture PEMs under `src/lib/__fixtures__/` (a good leaf, an expired one, one signed by an unknown issuer, and a file that contains a private key). `src/lib/certificate-submission.ts` to store and list submissions, tested first.
3. Interface: `src/app/api/certificates/route.ts` (POST the PEM, size-limited) and `src/app/lessons/verify/page.tsx`.
4. Walk the story as the student would. Add the end-to-end test at `e2e/verify-a-certificate.spec.ts`.
5. Update `README.md` or `CLAUDE.md` if a command changed.

## Acceptance criteria

- [ ] As a student, I can upload my certificate and see it checked: demonstrated end to end.
- [ ] Vitest covers the parse and check functions and the data-access functions as a caller would observe them, and passes.
- [ ] The end-to-end test passes.
- [ ] Anything containing `PRIVATE KEY` is refused and never stored.
- [ ] The migration is committed under `prisma/migrations/`.
- [ ] Every earlier test still passes; CI is green.
- [ ] Any new environment variable is in `.env.example` with a placeholder.

## Suggested skills

- `tdd`: the parser and checker are pure functions with fixtures; write the tests first.
- `api-design` and `error-handling`: the upload route's limits and its messages for a person with no technical experience.
- `security-scan`: this route accepts a file from the user.

## Notes

7.2 says the app "might need" this. The intake's definition of done (14.1) requires it, so it is a must-have here. What "verified" means beyond a well-formed certificate that chains to the student's own root is not specified; write the checks down in the lesson so the student knows what passes.
