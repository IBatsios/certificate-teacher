<!-- Hand-written for v2. Not generated from docs/intake.md; do not run /kickoff over it. -->

# 11: One lesson route

**What to build:** One `/lessons/[slug]` route serves every lesson, replacing the two hand-written page directories. Nothing a student sees changes. This is a refactor of working, deployed, tested code, and the existing test suite is the acceptance criterion.

**Blocked by:** 10.

**Status:** built on `feature/one-lesson-route`, pull request #25 open.

## Why

`src/app/lessons/certificates/page.tsx` and `src/app/lessons/deploy/page.tsx` are the same page twice, differing in a slug, an eyebrow, and a block of JSX naming the next thing to do. The Docker course adds three more lessons. Five near-identical directories is the wrong shape, and the "Every step is done" panel being JSX is what forces the copy: it is content living in code.

## Steps, a vertical slice in this order

1. Content: the finished panel moves to a `finished.md` beside `lesson.md` in each lesson folder, rendered through the existing `src/app/lessons/markdown.tsx`. Extend `loadLesson` in `src/lib/lesson.ts` to read it, with a test first. A lesson with no `finished.md` is valid; the panel is then the plain "every step is done" line.
2. The eyebrow ("Lesson 1", "Lesson 2") comes from the lesson's position in its course, from the catalog, not from a literal in a page.
3. Route: `src/app/lessons/[slug]/page.tsx`, resolving the slug through `courseFor(slug)` from Task 10 and returning `notFound()` when no course claims it. The lesson actions in `certificates/actions.ts` and `deploy/actions.ts` collapse into one set that takes the slug.
4. Delete the two old directories.
5. Walk both existing lessons as a student, in a browser, including start-over and the message banners.

## Acceptance criteria

- [x] `/lessons/certificates` and `/lessons/deploy` render exactly what they rendered before, including the finished panel and its links. Same words, same headings, same links to the same places; the panel body is now rendered markdown, so its links are plain anchors rather than Next `Link` elements, which navigates the same way for a student. One visible change outside the panel, recorded in D72: rendered markdown links are underlined, which the deploy lesson's one external link was not before.
- [x] A slug no course claims is a 404, not a crash and not a lesson with no steps. `e2e/lesson-route.spec.ts` checks the student's 404, and that a visitor is still sent to sign in first, which is the proxy's rule for everything under `/lessons/`.
- [x] All existing Playwright journeys pass **unchanged**: 42 of them, plus the new 404 journey. No existing spec was edited.
- [x] Vitest covers the `finished.md` loading, including a lesson that has none: `parseNote`, both real lessons' notes, and a fixture lesson under `src/lib/__fixtures__/lessons/bare/` with no note at all. 216 tests pass.
- [ ] Every earlier test still passes locally. CI green on the pull request.

## Suggested skills

- `tdd`: the loader change first.
- `frontend-patterns`: one route, content-driven.
- `code-review`: a refactor with no new behaviour is exactly where a review earns its keep.

## Notes

Resist widening the scope. This task adds no capability. Its whole value is that Tasks 12 to 14 become three markdown folders instead of three page directories, and the temptation to improve the lesson UI while in here is what would put that at risk.

The step keys in the existing content are stored against real student sessions. Do not rename one. `StepProgress.stepKey` is the join, and a rename silently un-ticks a step for everyone who has done it.

## Build notes

- The deploy page had two finished panels, one for the lesson and one for the
  whole course, so the content shape is `finished.md` plus an optional
  `course-finished.md`. The route shows the course note only when every step
  of every lesson in the course is ticked and the lesson has one; otherwise
  the lesson note; otherwise the plain line. The certificates lesson has only
  `finished.md`, so it reads as it did.
- `loadLesson` takes an optional content root so the tests can load a lesson
  the real content does not have. `loadCourseLessons` is unchanged.
- The route resolves `courseFor(slug)` before `requireRole`, so an unknown
  slug is a 404 before anything else is looked at. A visitor who is signed
  out never gets that far: the proxy sends them to sign in for every path
  under `/lessons/`, which is what happened before there was a route. The
  actions check the catalog too: the slug arrives as a bound argument, which
  travels through the browser, so nothing is read or written for a slug no
  course claims.
- The panel's markdown is wrapped in a `finished-note` block that zeroes the
  paragraph margins `.lesson-body` adds, so the note sits in its panel as
  the JSX version did.
- The dev server's generated route types under `.next/dev/types` still named
  the deleted pages after this change, and `pnpm typecheck` failed on them
  until `.next` was removed. Worth knowing when a page directory goes away.
