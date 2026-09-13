import { describe, expect, test } from "vitest";
import {
  CHALLENGE_TOKEN_PATTERN,
  challengeTokenFor,
  deriveChallengeToken,
} from "@/lib/challenge-token";

const KEY = "a-long-random-string-only-this-deployment-knows";
const SESSION = "cmfj3x9k20000abcd1234efgh";
const OTHER_SESSION = "cmfj3x9k20001wxyz5678ijkl";

describe("deriveChallengeToken", () => {
  test("gives the same token for the same session every time", () => {
    // Act
    const first = deriveChallengeToken(SESSION, KEY);
    const second = deriveChallengeToken(SESSION, KEY);

    // Assert: a student can reload the lesson tomorrow and copy the same one.
    expect(second).toBe(first);
  });

  test("looks like four groups of four hex digits, so it can be typed by hand", () => {
    // Act
    const token = deriveChallengeToken(SESSION, KEY);

    // Assert
    expect(token).toMatch(CHALLENGE_TOKEN_PATTERN);
    expect(token).toHaveLength(19);
  });

  test("gives a different token for a different session", () => {
    // Arrange: another student, or the same student after a start-over,
    // has another session id.
    const token = deriveChallengeToken(SESSION, KEY);

    // Act
    const other = deriveChallengeToken(OTHER_SESSION, KEY);

    // Assert
    expect(other).not.toBe(token);
  });

  test("gives a different token under a different key", () => {
    // Arrange: the token cannot be worked out from a session id without the
    // key, so development and production cannot mint each other's.
    const token = deriveChallengeToken(SESSION, KEY);

    // Act
    const other = deriveChallengeToken(SESSION, "some-other-key");

    // Assert
    expect(other).not.toBe(token);
  });

  test("does not carry the session id inside it", () => {
    // Act
    const token = deriveChallengeToken(SESSION, KEY);

    // Assert: the id is the thing being hidden.
    expect(SESSION).not.toContain(token.replaceAll("-", ""));
    expect(token).not.toContain(SESSION.slice(0, 8));
  });

  test("refuses an empty key rather than minting guessable tokens", () => {
    expect(() => deriveChallengeToken(SESSION, "")).toThrow(
      /CHALLENGE_TOKEN_KEY/,
    );
    expect(() => deriveChallengeToken(SESSION, "   ")).toThrow(
      /CHALLENGE_TOKEN_KEY/,
    );
  });

  test("refuses an empty session id", () => {
    expect(() => deriveChallengeToken("", KEY)).toThrow(/session/);
  });
});

describe("challengeTokenFor", () => {
  test("derives the token with the key from the environment", () => {
    // Arrange
    const env = { CHALLENGE_TOKEN_KEY: KEY };

    // Act
    const token = challengeTokenFor(SESSION, env);

    // Assert
    expect(token).toBe(deriveChallengeToken(SESSION, KEY));
  });

  test("names the missing variable when the environment has no key", () => {
    expect(() => challengeTokenFor(SESSION, {})).toThrow(/CHALLENGE_TOKEN_KEY/);
  });
});
