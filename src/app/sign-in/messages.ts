// Messages the sign-in page can show, keyed by the value in `?error=`. Our
// actions use the lower-case keys; Auth.js itself sends people back here with
// its own capitalised codes when a magic link fails.
export const SIGN_IN_MESSAGES = {
  missing: "Enter your email and your password.",
  "wrong-password":
    "That email and password do not match. Check both and try again, or ask for a sign-in link instead.",
  "missing-email": "Enter your email to get a sign-in link.",
  "link-not-sent":
    "We could not send the sign-in link. Wait a moment and try again.",
  "account-ready": "Your account is ready. Sign in to continue.",
  "too-many-attempts": "Too many attempts. Wait fifteen minutes and try again.",
  Verification:
    "That sign-in link has expired or was already used. Ask for a new one below.",
  Default: "Something went wrong while signing you in. Try again.",
} as const;

export type SignInMessageKey = keyof typeof SIGN_IN_MESSAGES;

export function isSignInMessageKey(value: string): value is SignInMessageKey {
  return Object.hasOwn(SIGN_IN_MESSAGES, value);
}

/** The sign-in page URL that shows the given message. */
export function signInPageWithMessage(key: SignInMessageKey): string {
  return `/sign-in?error=${key}`;
}
