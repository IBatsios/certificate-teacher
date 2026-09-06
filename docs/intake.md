---
# kickoff intake. Fill this in, then run /kickoff in the project folder.
# The block between the --- lines is for the developer. Everyone else: skip to "Section 1" below.
# Options are listed after each # sign. Write the option exactly as shown. Leave a field blank if you do not know.
# If your answer is not in the list, write your own. It is recorded as-is and gets the generic setup instead of a stack-specific one.

kickoff_version: 0.1.0

project:
  name: "teacher"
  slug: "teacher"           # lowercase-with-hyphens; blank derives it from name
  type: "web app"           # web app | API only | command-line tool | desktop app | mobile app | library | other

data:
  sensitive: [personal details]   # personal details | payment data | health data | data about minors | none

features:
  auth: true               # true if anyone signs in (Section 6)
  auth_methods: [email and password, magic link]   # email and password | magic link | Google | GitHub | Apple | Microsoft | single sign-on | other

stack:                     # (developer) Section 8
  language: "TypeScript"   # TypeScript | JavaScript | Python | Go | Rust | other
  frontend: "Next.js"      # Next.js | React with Vite | Astro | Vue or Nuxt | SvelteKit | none | other
  backend: "Next.js route handlers"   # Next.js route handlers | Express | Fastify | NestJS | FastAPI | Django | none | other
  database: "PostgreSQL"   # PostgreSQL | SQLite | MySQL | MongoDB | none | other
  data_layer: "Prisma"     # Prisma | Drizzle | SQLAlchemy | Django ORM | raw driver | none | other
  styling: "Tailwind"      # Tailwind | CSS Modules | plain CSS | styled-components | none | other
  tests: [Vitest, Playwright]   # Vitest | Jest | Playwright | pytest | Go test | other
  package_manager: "pnpm"  # pnpm | npm | yarn | bun | uv | pip | cargo | Go modules | other

environment:               # (developer) Sections 8 and 10
  os: "Windows"            # Windows | macOS | Linux
  shell: "PowerShell"      # PowerShell | bash | zsh | fish
  dev_database: "Docker Compose"   # Docker Compose | already installed on localhost | hosted connection string   (required if database is not none)

git:                       # (developer) Section 9
  host: "GitHub"           # GitHub | GitLab | Gitea | other | local only
  host_url: ""             # only for GitLab, Gitea, other. Example: https://gitlab.example.com
  owner: "IBatsios"        # the user or group the repository is created under
  visibility: "public"     # public | private
  license: "MIT"           # only if public: MIT | Apache-2.0 | GPL-3.0 | Unlicense | other
  existing_repo_url: ""    # only if the repository already exists

deployment:                # (developer) Section 10
  target: "Railway"        # Vercel | Netlify | Cloudflare | Fly.io | Railway | Docker on a server I control | desktop packaging | local only | other
  domain: "teacher.ioannisbatsios.com"   # the apex serves the personal website; Teacher lives on a subdomain (D40)
  environments: [development, production]   # development | staging | production

conventions:               # (developer) Section 9. Asked in the walkthrough. Blank means "use kickoff's default, or my saved default".
  protect_default_branch: true   # true | false     work on branches, merge via MR or PR
  branch_prefixes: [feature, fix, chore]   # default: feature, fix, chore
  commit_style: conventional     # conventional | free
  env_example: true              # true | false
  db_backup_before_migrate: true # true | false
  handoff_docs: true             # true | false
---

# Intake: teacher

How to fill this in:

- Answer under each question, after the `>` mark. Write as much or as little as you like.
- "I don't know" is a real answer for any optional question. It is recorded as something to find out. A blank is recorded as something nobody considered. Prefer "I don't know".
- Sections marked **(developer)** can be left for the developer.
- Sections marked **required** must be answered before the build can run. Inside them, every question not marked (optional) is required. Everything else is optional; blanks become open questions in the plan.
- The build never edits this file. To change the plan later, change this file and run `/kickoff` again.

## Section 1 — Project identity (required)

Fill `project.name`, `project.slug`, and `project.type` at the top, then answer here.

### 1.3 One-line pitch: "<name> is a <thing> for <who> that <does what>."

_If this is hard to write, the project is not defined yet. That is worth knowing now._

> Teacher is an app that teaches users how certificate chains work, how to get https in your browser, import certs into a Java keystore (and why it's necessary), and how to set up a reverse proxy.

## Section 2 — The problem (required)

### 2.1 What problem does this solve? Describe it from the point of view of the person who has it.

> Reading about security is too hard; it is easier to see it applied.

### 2.2 Who has this problem today, and how do they cope now?

_A spreadsheet, a competitor, doing nothing. Name the thing you are replacing._

> Our work staff needs guidance.

### 2.3 Why build it now? (optional)

>

### 2.4 What happens if it is never built? (optional)

>

## Section 3 — Users and roles (required)

### 3.1 Who uses it? One line per type of user: who they are and what they want from it.

> Anyone that wants to learn.

### 3.2 Do different users get to do different things? List the roles, or write "one role".

_For example: admin, member, visitor._

> Student (everyone who learns) and admin (views results and progress per student). Originally answered "one role, all are students"; the admin came up in 6.5.

### 3.3 How many users at launch, and a year later? A rough guess is fine. (optional)

>

### 3.4 How technical are they? Choose one: not at all / comfortable with apps / developers.

> Assume all three will use it, so develop for no experience (not at all).

## Section 4 — Core features (required)

### 4.1 Must have for v1. One per line: "As a <role>, I can <do something>, so that <benefit>."

_The task list is generated from this list. Vague lines make vague tasks._

> As a student, I can now generate my own certificates, deploy them, and test using a reverse proxy and with Java.

### 4.2 Should have. Same shape. (optional)

_Built after the must-haves. First to be cut if the plan is too big._

>

### 4.3 Could have. Same shape. (optional)

_Recorded, not scheduled._

>

### 4.4 The single most important thing a user does with it.

_This is the first path that gets built end to end._

> It must confirm their knowledge that they were able to apply and deploy; include a test phase they have to complete to pass.

## Section 5 — Data (optional)

Fill `data.sensitive` at the top, then answer here.

### 5.1 The main things the app keeps track of. One per line: what it is and what it is connected to.

_For example: "Invoice, belongs to a Customer, has many Line Items."_

> It keeps track of sessions so users don't lose progress.

### 5.2 What must never be lost or wrong?

> Users' progress when they save the session.

### 5.3 Does anything need to be deleted, or kept for a fixed time?

> Sessions need to be recoverable, but starting over should be allowed.

## Section 6 — Sign-in and permissions (optional)

Set `features.auth` at the top. If it is `false`, skip this section. If `true`, fill `features.auth_methods` and answer here.

### 6.3 Who can do what? A short list: the role, then the things that role can do.

> Student: work through the lessons, save and recover a session, start over, upload a certificate, take the test. Admin: view results and progress per student, export them, and change other users' roles. The two areas are exclusive; the admin uses a separate student account to walk the lessons. (Answered in Task 02.)

### 6.4 Can visitors who are not signed in see anything? What?

> Only the home page, sign-in, sign-up, and the two pages those link to (check your email, forbidden). Everything else needs a sign-in. (Answered in Task 02.)

### 6.5 Is there an admin who manages other users? yes / no

> Yes: admin can view results and progress per student.

## Section 7 — Integrations (optional)

### 7.1 External services this depends on. One per line: name, what it is for, and whether you already have an account.

_Think payments, email, file storage, maps, analytics, AI, calendars. Each one becomes a setup step._

> Magic-link email: SMTP through Auth.js's Nodemailer provider. Mailpit catches it in development (docker-compose.override.yml); production uses any SMTP service, Resend's suggested. Variables: EMAIL_SERVER and EMAIL_FROM. (Answered in Task 02.)

### 7.2 Anything it must import from or export to? Files, other systems, formats.

> Export results with focus areas. Might need to be able to import users' self-signed certificates for review/verification.

## Section 8 — Stack (required) (developer)

Fill the `stack` and `environment` blocks at the top. Every field is asked every time; saved defaults are only suggestions.

### 8.11 Anything the menus cannot capture: must-use libraries, must-avoid ones, pinned versions. (optional)

> Auth.js for email-and-password plus magic link. `@peculiar/x509` for parsing the certificates students upload.

## Section 9 — Git host, visibility, and conventions (required) (developer)

Fill the `git` block at the top. Fill the `conventions` block too, or leave it blank to use the defaults. Nothing to answer here.

## Section 10 — Deployment, hosting, and dev environment (optional) (developer)

Fill the `deployment` block and `environment.dev_database` at the top. `dev_database` is required if a database was chosen.

### 10.5 Where do secrets live in production?

_Platform environment variables, a vault, a file on the server._

> .env

## Section 11 — Non-functional needs (optional)

### 11.1 How many people use it at once, and how fast must it feel?

> A handful of staff at once. Pages should feel instant; the only heavy server work is parsing an uploaded certificate.

### 11.2 Accessibility target. Choose one: WCAG 2.2 AA / best effort / not a priority.

> best effort

### 11.3 Devices and browsers that must work.

> Current Chrome, Edge, and Firefox on desktop, since students run Java and a reverse proxy on a desktop anyway. Phone is nice-to-have.

### 11.4 Must it work offline? yes / no

> no

### 11.5 Languages the interface must support. (default: English only)

> English only

### 11.6 Security or compliance requirements you know of. (GDPR, HIPAA, SOC 2, none known)

> None known. Personal details are stored, so hashed passwords and HTTPS are the baseline.

### 11.7 Uptime expectation. Choose one: hobby / business hours / always on.

> business hours

## Section 12 — Constraints (optional)

### 12.1 Deadline or first milestone.

> No deadline. First milestone: one student completes the certificate lesson and passes its test.

### 12.2 Budget for paid services. Choose one: free tiers only / some / not a concern.

> some

### 12.3 Who is working on it? One per line: name, role, developer or not.

> Ioannis Batsios, developer and content author.

### 12.4 Existing assets to reuse: designs, brand, domain, content, code.

> The domain ioannisbatsios.com. Nothing else.

### 12.5 Must-use or must-avoid technology, vendors, or licenses.

> None beyond 8.11.

## Section 13 — Out of scope (optional, strongly encouraged)

### 13.1 Things this will explicitly not do in v1.

> No course authoring UI: lessons are written in code or markdown by the developer.
> No running Java or a reverse proxy inside the app: students do that on their own machine.
> No certificate authority service: the app does not issue real certificates.
> No mobile layout.

### 13.2 Things people will ask for that you are saying no to, and why.

> "Teach other security topics": v1 is one path, certificates through to a reverse proxy, done well.
> "Team or organization accounts": one admin and all students, until someone needs more.

## Section 14 — Definition of done for v1 (optional)

### 14.1 What must be true to call v1 done? Checkable statements, one per line.

> A new user can sign up with email and password or a magic link, and sign back in.
> A student can work through the certificate-chain lesson, generate a certificate, deploy it, and verify it with a reverse proxy and a Java keystore, with progress saved between visits.
> A student can upload their certificate and the app checks it.
> A student can take the test phase, and a pass or fail with focus areas is recorded.
> A student can start over without losing the option to recover the old session.
> The admin can see every student's progress and results and export them.
> It is live at teacher.ioannisbatsios.com over HTTPS. (The apex serves the personal website; changed in Task 08.)

### 14.2 A month after launch, how will you know it worked?

> At least one staff member has passed the test, and the admin view shows where people got stuck.
