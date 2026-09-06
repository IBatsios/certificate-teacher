// Messages the test page can show, keyed by the value the server action puts
// in `?error=`. Keeping keys and text together means a typo on either side
// is a type error, not a silently blank page.
export const TEST_MESSAGES = {
  unanswered: "Choose an answer before checking it.",
  "not-saved": "Your answer could not be saved. Wait a moment and try again.",
  "not-found": "We could not find that attempt. Take the test again.",
} as const;

export type TestMessageKey = keyof typeof TEST_MESSAGES;

export function isTestMessageKey(value: string): value is TestMessageKey {
  return Object.hasOwn(TEST_MESSAGES, value);
}

/** The test page URL that shows the given message. */
export function testPageWithMessage(key: TestMessageKey): string {
  return `/test?error=${key}`;
}
