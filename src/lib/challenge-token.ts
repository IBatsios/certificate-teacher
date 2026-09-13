import { createHmac } from "node:crypto";

// The token a student writes into their own image as a label, so the check
// at the end of the Docker course can tell that the image it is reading
// about was built in this session and not pasted from someone else's. It is
// derived, never stored: a keyed hash of the learning session id. Nothing
// new is written to the database, a start-over changes it because the
// session changes, and without the key nobody can work one out from a
// session id or from another student's token. Pure: no database, no request.

/** What a token looks like: four groups of four hex digits. */
export const CHALLENGE_TOKEN_PATTERN = /^[0-9a-f]{4}(?:-[0-9a-f]{4}){3}$/;

/** The variable holding the key; a long random string, in `.env.example`. */
export const CHALLENGE_TOKEN_KEY_VARIABLE = "CHALLENGE_TOKEN_KEY";

const GROUP_LENGTH = 4;
const GROUP_COUNT = 4;
// Ties the hash to this one use, so a key that is ever reused for something
// else cannot mint tokens by hashing the same id.
const PURPOSE = "teacher.challenge";

/**
 * The token for a session under a key. Sixteen hex digits, grouped so that a
 * student on a borrowed machine can type it by hand; short enough for that,
 * and far too long to guess. Refuses a blank key: a token minted without one
 * would be the same on every deployment.
 */
export function deriveChallengeToken(sessionId: string, key: string): string {
  if (sessionId.trim() === "") {
    throw new Error("A challenge token needs a learning session id.");
  }
  if (key.trim() === "") {
    throw new Error(
      `A challenge token needs a key. Set ${CHALLENGE_TOKEN_KEY_VARIABLE}; see .env.example.`,
    );
  }
  const digest = createHmac("sha256", key)
    .update(`${PURPOSE}:${sessionId}`)
    .digest("hex");
  const groups = Array.from({ length: GROUP_COUNT }, (_, i) =>
    digest.slice(i * GROUP_LENGTH, (i + 1) * GROUP_LENGTH),
  );
  return groups.join("-");
}

/** The token for a session, with the key read from the environment. */
export function challengeTokenFor(
  sessionId: string,
  env: Readonly<Record<string, string | undefined>> = process.env,
): string {
  return deriveChallengeToken(
    sessionId,
    env[CHALLENGE_TOKEN_KEY_VARIABLE] ?? "",
  );
}
