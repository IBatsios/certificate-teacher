import { MIN_PASSWORD_LENGTH } from "@/lib/password";

// Messages the sign-up page can show, keyed by the value in `?error=`.
export const SIGN_UP_MESSAGES = {
  missing: "Enter your email and choose a password.",
  "password-too-short": `Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.`,
  "admin-by-link":
    "That address belongs to the admin. Go to sign in and ask for a link by email instead; opening it creates the admin account.",
  "already-registered":
    "That email already has an account. Sign in instead, or ask for a sign-in link.",
  "too-many-attempts":
    "Too many accounts created from here in a short time. Wait fifteen minutes and try again.",
  "not-saved":
    "Your account could not be created. Wait a moment and try again.",
} as const;

export type SignUpMessageKey = keyof typeof SIGN_UP_MESSAGES;

export function isSignUpMessageKey(value: string): value is SignUpMessageKey {
  return Object.hasOwn(SIGN_UP_MESSAGES, value);
}

/** The sign-up page URL that shows the given message. */
export function signUpPageWithMessage(key: SignUpMessageKey): string {
  return `/sign-up?error=${key}`;
}
