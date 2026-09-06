export const CERTIFICATES_LESSON_PATH = "/lessons/certificates";

// Messages the lesson page can show, keyed by the value in `?message=`. One
// of them reports success, so the parameter is not called `error`.
export const LESSON_MESSAGES = {
  "started-over":
    "A fresh session has started. Your earlier one is kept at the bottom of the page.",
  "unknown-step":
    "That step is not part of this lesson. Reload the page and try again.",
  "not-saved": "Your progress could not be saved. Wait a moment and try again.",
} as const;

export type LessonMessageKey = keyof typeof LESSON_MESSAGES;

export function isLessonMessageKey(value: string): value is LessonMessageKey {
  return Object.hasOwn(LESSON_MESSAGES, value);
}

/** The lesson page URL that shows the given message. */
export function lessonPageWithMessage(key: LessonMessageKey): string {
  return `${CERTIFICATES_LESSON_PATH}?message=${key}`;
}

/** The lesson page URL scrolled to one step. */
export function lessonPageAtStep(stepKey: string): string {
  return `${CERTIFICATES_LESSON_PATH}#step-${stepKey}`;
}
