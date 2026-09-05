<!-- Generated from docs/intake.md by kickoff v0.1.0. Edit the intake, not this file. -->

# teacher — Product Requirements

Teacher is an app that teaches users how certificate chains work, how to get https in your browser, import certs into a Java keystore (and why it's necessary), and how to set up a reverse proxy.

## Problem

Reading about security is too hard for me; it is easier when I can see it applied.

**Today:** Our work staff needs guidance.

## Users

| User | Wants | Role |
|---|---|---|
| Anyone who wants to learn | To learn certificate chains, https in the browser, Java keystores, and reverse proxies by applying them | student |
| The person guiding the staff | To see results and progress per student | admin |

Scale: unknown. Technical comfort: assume all three levels will use it, so develop for no experience (not at all).

## User stories

### Must have for v1

1. As a student, I can generate my own certificates, deploy them, and test using a reverse proxy and with Java, so that I learn how certificate chains work by applying them (inferred).
2. As a student, I can upload my self-signed certificate for review and verification, so that the app confirms I applied the lesson correctly. (inferred from 7.2 and 14.1)
3. As a student, I can take a test phase and see a pass or fail with focus areas recorded, so that my knowledge is confirmed. (inferred from 4.4 and 14.1)
4. As a student, I can save my session, come back to it later, or start over without losing the old one, so that I never lose progress. (inferred from 5.1, 5.3, and 14.1)
5. As an admin, I can view results and progress per student and export results with focus areas, so that I know where staff need guidance. (inferred from 6.5, 7.2, and 14.1)

## The most important path

It must confirm their knowledge that they were able to apply and deploy; include a test phase they have to complete to pass.

This is the path Task 01, the walking skeleton, proves end to end before any other feature is built.

## Data

- Session: belongs to a student; holds their progress so they don't lose it between visits.

Must never be lost or wrong: users' progress when they save the session. Retention: sessions need to be recoverable, but starting over should be allowed. Sensitive categories: personal details.

## Sign-in and permissions

Methods: email and password, magic link. Visitors who are not signed in can: not specified (6.4 was skipped). Admin manages users: yes; the admin can view results and progress per student.

| Role | Can |
|---|---|
| student | Work through the lessons, save and recover a session, start over, upload a certificate for verification, take the test (from 4.1, 4.4, 5.3, and 7.2; 6.3 was skipped) |
| admin | View results and progress per student; export results with focus areas (from 6.5 and 7.2) |

## Integrations

Imports and exports: Export results with focus areas. Might need to be able to import users' self-signed certificates for review/verification.

## Non-functional requirements

- Load and speed: a handful of staff at once; pages feel instant; the only heavy server work is parsing an uploaded certificate.
- Accessibility: best effort.
- Devices and browsers: current Chrome, Edge, and Firefox on desktop; phone is nice-to-have.
- Offline: no.
- Languages: English only.
- Security and compliance: none known; personal details are stored, so passwords are hashed and traffic is over HTTPS.
- Uptime: business hours.

## Constraints

- Deadline: none. First milestone: one student completes the certificate lesson and passes its test.
- Budget: some.
- Team: Ioannis Batsios, developer and content author.
- Existing assets: the domain ioannisbatsios.com; nothing else.
- Must use or avoid: none beyond 8.11 (Auth.js for sign-in; `@peculiar/x509` for parsing uploaded certificates).

## Out of scope

- No course authoring UI: lessons are written in code or markdown by the developer.
- No running Java or a reverse proxy inside the app: students do that on their own machine.
- No certificate authority service: the app does not issue real certificates.
- No mobile layout.
- "Teach other security topics": v1 is one path, certificates through to a reverse proxy, done well.
- "Team or organization accounts": one admin and all students, until someone needs more.

## Definition of done for v1

- [ ] A new user can sign up with email and password or a magic link, and sign back in.
- [ ] A student can work through the certificate-chain lesson, generate a certificate, deploy it, and verify it with a reverse proxy and a Java keystore, with progress saved between visits.
- [ ] A student can upload their certificate and the app checks it.
- [ ] A student can take the test phase, and a pass or fail with focus areas is recorded.
- [ ] A student can start over without losing the option to recover the old session.
- [ ] The admin can see every student's progress and results and export them.
- [ ] It is live at ioannisbatsios.com over HTTPS.

**Success signal, one month after launch:** At least one staff member has passed the test, and the admin view shows where people got stuck.

## Open questions

**Skipped, never considered:**

- 2.3 Why build it now?
- 2.4 What happens if it is never built?
- 3.3 How many users at launch, and a year later?
- 6.3 Who can do what, per role?
- 6.4 What can visitors who are not signed in see?
- 7.1 External services: magic-link sign-in needs an email sender, and none was chosen.
