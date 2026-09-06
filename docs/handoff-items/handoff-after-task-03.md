# Handoff — after Task 03, the certificates lesson

**Date:** 2026-09-06
**Phase finished:** Task 03: the certificates lesson with progress that saves, resumes, and starts over without loss
**Next phase:** push, open the pull request, watch both CI jobs, merge; then Task 04 (deploy lesson), Task 05 (verify an upload), or Task 08 (deploy to Railway), all on the frontier

## Where things stand

- Branch `feature/certificates-lesson`, off `main`. Nothing else is in flight.
- Schema: `LearningSession` (active or archived, started and archived timestamps) and `StepProgress` (step key, done at, unique per session and key). Migration `20260906202507_learning_session`, additive only.
- Data access in `src/lib/learning-session.ts`: `startOrResume`, `markStepDone`, `markStepNotDone`, `startOver`, `listArchivedSessions`. Start-or-resume and start-over run as serializable transactions. Tested against the database in `src/lib/learning-session.test.ts` (D36).
- Content in `content/lessons/certificates/`: `lesson.md` plus five steps, keys `chain`, `openssl`, `root`, `leaf`, `verify`. Loaded by `src/lib/lesson.ts`, rendered by `src/app/lessons/markdown.tsx`. Every OpenSSL command was run on this machine's OpenSSL 3.5 while writing (D35).
- The page at `src/app/lessons/certificates/page.tsx` with three server actions (tick, un-tick, start over) in `actions.ts`. Shared pieces for the next lesson live one folder up: `step-card.tsx`, `code-block.tsx`, `copy-button.tsx`, `markdown.tsx`. Styling for rendered markdown is the `.lesson-body` block in `globals.css`.
- Routing: a student's home is now the lesson (D37); `/lessons` is a student-only area; the test page links back to the lesson.
- Tests: 45 in Vitest (8 of them against the database) and 11 Playwright journeys, two of them for the lesson. `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm test:e2e` all pass.
- CI's unit job now has a Postgres service and runs the migrations before the tests.
- Decisions D32 to D38 in `docs/DECISIONS.md`.

## Things the next session should know

- **The backup command from Git Bash.** `docker compose exec db pg_dump -f /tmp/backup.sql` fails from Git Bash because MSYS rewrites `/tmp/backup.sql` into a Windows path before Docker sees it. Prefix the command with `MSYS_NO_PATHCONV=1`, or run the copy-out form from PowerShell 7. And `docker compose cp` has no `-q` flag. The intake owns the runbook; this belongs in its wording.
- **A server action that redirects to the same path with a hash does not refresh the page.** Next treats it as a scroll. The lesson actions call `revalidatePath` before redirecting, which makes the action's response carry the freshly rendered page. Reuse `trySave` in `src/app/lessons/certificates/actions.ts` for the deploy lesson.
- **Step keys are forever.** Progress is stored by key. Renaming a key orphans every tick under the old one. Renumber files freely; never change a key.
- **Fence languages are labels.** In content, ```` ```shell ```` means "same in PowerShell and Terminal", ```` ```powershell ```` Windows only, ```` ```bash ```` Mac or Linux only, ```` ```text ```` expected output without a copy button. `src/app/lessons/code-block.tsx` maps them.
- **The Windows OpenSSL install path is untested on a clean machine.** The lesson suggests `winget install ShiningLight.OpenSSL.Light` and, as a fallback, adding Git's copy to the path. Someone with a fresh Windows machine should walk step 2 once. Mac users get LibreSSL, which handles everything the lesson runs.
- **Task 04 reuses everything here.** Add `content/lessons/deploy/`, a page at `src/app/lessons/deploy/`, and its own `messages.ts` and `actions.ts` following the certificates pair; the `StepCard` and `Markdown` components take the same props. The deploy steps go in the same session under new keys, so the session functions need no change. The "Finished" callout on the certificates page should then link to the deploy lesson instead of saying it is coming.
- **`pnpm test` needs the compose database up.** The session tests connect through `.env`; without the database they fail rather than skip.
- Task 02's notes still hold: Mailpit's inbox is on 8026, the dev server takes 3001, the browser tests run their own app on 3100, and the admin account can only be created by a magic link.

## What to do next, in order

1. `git push -u origin feature/certificates-lesson`, open the pull request to `main`, and wait for both CI jobs. Tick the last box in `docs/tasks/03-generate-a-certificate.md` when they are green.
2. Merge. Then pick from the frontier. Task 04 is the natural continuation and reuses this task's pieces. Task 08 would put the sign-in and this lesson in front of real staff and needs a Railway account, a Postgres service, and an SMTP service.
3. `/project-init` (runbook 0.5) is still not run.
4. When a phase ends, write the next handoff doc here, in this shape.

## Suggested skills for the next session

- `plan` and `tdd`: at the start of the next task.
- `frontend-patterns`: Task 04 shares the lesson layout with Task 03; reuse, do not copy.
- `e2e-testing`: extending `e2e/` for the deploy lesson.
- The full list, with when to use each, is in `CLAUDE.md`.
