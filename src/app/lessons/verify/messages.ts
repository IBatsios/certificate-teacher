export const VERIFY_PATH = "/lessons/verify";

// Everything the check can say when it will not produce a verdict. The reasons
// a certificate fails its checks are not here: those come from
// CERTIFICATE_CHECKS and are shown against the certificate itself.
//
// OpenSSL's own wording, such as "PEM routines::no start line", never reaches
// this list. It describes the parser's problem, not the student's.
export const VERIFY_MESSAGES = {
  "no-files":
    "Choose both files, or paste both certificates, and try again. The check needs your root and the certificate it signed.",
  "root-not-a-certificate":
    "The root you sent is not a certificate. It should be my-root.crt, which starts with the line BEGIN CERTIFICATE.",
  "leaf-not-a-certificate":
    "The certificate you sent could not be read. It should be localhost.crt, which starts with the line BEGIN CERTIFICATE.",
  "private-key":
    "That file holds a private key, so nothing was checked and nothing was kept. Send only the .crt files: a private key should never leave your computer, not even to us.",
  "too-large":
    "That file is far larger than a certificate. Send the .crt file itself rather than an archive or a screenshot.",
  "too-many":
    "That is a lot of checks in a short time. Wait a few minutes and try again.",
  "not-saved":
    "The check ran but the result could not be saved. Wait a moment and try again.",
} as const;

export type VerifyMessageKey = keyof typeof VERIFY_MESSAGES;

export function isVerifyMessageKey(value: string): value is VerifyMessageKey {
  return Object.hasOwn(VERIFY_MESSAGES, value);
}

/** The verify page showing one message. */
export function verifyPageWithMessage(key: VerifyMessageKey): string {
  return `${VERIFY_PATH}?message=${key}`;
}

/** What the page shows for its `?message=`, ignoring anything unrecognised. */
export function verifyMessageFor(
  value: string | string[] | undefined,
): string | undefined {
  const key = Array.isArray(value) ? value[0] : value;
  return key !== undefined && isVerifyMessageKey(key)
    ? VERIFY_MESSAGES[key]
    : undefined;
}
