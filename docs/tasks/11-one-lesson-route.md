<!-- Hand-written for v2. Not generated from docs/intake.md; do not run /kickoff over it. -->

# 11: One lesson route

**What to build:** One `/lessons/[slug]` route serves every lesson, replacing the two hand-written page directories. Nothing a student sees changes. This is a refactor of working, deployed, tested code, and the existing test suite is the acceptance criterion.

**Blocked by:** 10.

**Status:** not started.

## Why

`src/app/lessons/certificates/page.tsx` and `src/app/lessons/deploy/page.tsx` are the same page twice, differing in a slug, an eyebrow, and a block of JSX naming the next thing to do. The Docker course adds three more lessons. Five near-identical directories is the wrong shape, and the "Every step is done" panel being JSX is what forces the copy: it is content living in code.

## Steps, a vertical slice in this order

1. Content: the finished panel moves to a `finished.md` beside `lesson.md` in each lesson folder, rendered through the existing `src/app/lessons/markdown.tsx`. Extend `loadLesson` in `src/lib/lesson.ts` to read it, with a test first. A lesson with no `finished.md` is valid; the panel is then the plain "every step is done" line.
2. The eyebrow ("Lesson 1", "Lesson 2") comes from the lesson's position in its course, from the catalog, not from a literal in a page.
3. Route: `src/app/lessons/[slug]/page.tsx`, resolving the slug through `courseFor(slug)` from Task 10 and returning `notFound()` when no course claims it. The lesson actions in `certificates/actions.ts` and `deploy/actions.ts` collapse into one set that takes the slug.
4. Delete the two old directories.
5. Walk both existing lessons as a student, in a browser, including start-over and the message banners.

## Acceptance criteria

- [ ] `/lessons/certificates` and `/lessons/deploy` render exactly what they rendered before, including the finished panel and its links.
- [ ] A slug no course claims is a 404, not a crash and not a lesson with no steps.
- [ ] All 35 existing Playwright journeys pass **unchanged**. If a journey needs editing to pass, the refactor changed behaviour and that is a bug, not a test to update.
- [ ] Vitest covers the `finished.md` loading, including a lesson that has none.
- [ ] Every earlier test still passes locally. CI green on the pull request.

## Suggested skills

- `tdd`: the loader change first.
- `frontend-patterns`: one route, content-driven.
- `code-review`: a refactor with no new behaviour is exactly where a review earns its keep.

## Notes

Resist widening the scope. This task adds no capability. Its whole value is that Tasks 12 to 14 become three markdown folders instead of three page directories, and the temptation to improve the lesson UI while in here is what would put that at risk.

The step keys in the existing content are stored against real student sessions. Do not rename one. `StepProgress.stepKey` is the join, and a rename silently un-ticks a step for everyone who has done it.
