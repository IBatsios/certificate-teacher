// How the lesson pages address themselves, and the few things they can say
// when a form comes back. Shared by every lesson, so a second lesson needs no
// copy of it. Pure: no database, no request, no React.

export const LESSONS_ROOT = "/lessons";

// The lessons a student works through, in order. "Finished" means every step
// of every one of these, not either lesson alone.
export const COURSE_SLUGS = ["certificates", "deploy"] as const;

// Messages a lesson page can show, keyed by the value in `?message=`. One of
// them reports success, so the parameter is not called `error`.
export const LESSON_MESSAGES = {
  "started-over":
    "A fresh session has started. Your earlier one is kept at the bottom of the page.",
  "unknown-step":
    "That step is not part of this lesson. Reload the page and try again.",
  "not-saved": "Your progress could not be saved. Wait a moment and try again.",
} as const;

export type LessonMessageKey = keyof typeof LESSON_MESSAGES;

/** Whether a value from the query string names a message we know. */
export function isLessonMessageKey(value: string): value is LessonMessageKey {
  return Object.hasOwn(LESSON_MESSAGES, value);
}

/** The page for one lesson. */
export function lessonPath(slug: string): string {
  return `${LESSONS_ROOT}/${slug}`;
}

/** The lesson page showing the given message. */
export function lessonPathWithMessage(
  slug: string,
  key: LessonMessageKey,
): string {
  return `${lessonPath(slug)}?message=${key}`;
}

/**
 * The lesson page scrolled to one step. The key is escaped so that a key
 * holding a space or a `#` cannot change where the URL points; no lesson uses
 * such a key, and none should.
 */
export function lessonPathAtStep(slug: string, stepKey: string): string {
  return `${lessonPath(slug)}#step-${encodeURIComponent(stepKey)}`;
}

/**
 * What a lesson page shows for its `?message=`. Next hands a query parameter
 * over as a string, an array when it is repeated, or undefined when absent;
 * anything we do not recognise is ignored rather than shown.
 */
export function lessonMessageFor(
  value: string | string[] | undefined,
): string | undefined {
  const key = Array.isArray(value) ? value[0] : value;
  return key !== undefined && isLessonMessageKey(key)
    ? LESSON_MESSAGES[key]
    : undefined;
}
