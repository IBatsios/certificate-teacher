import argon2 from "argon2";

/**
 * Hashes a password for storage. argon2id with the library's defaults, which
 * follow the OWASP recommendation; the parameters are stored inside the hash,
 * so raising them later only affects new hashes.
 */
export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

/** True when `password` is the one `hash` was made from. */
export function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  return argon2.verify(hash, password);
}

/** Shortest password sign-up accepts. Length beats complexity rules for people. */
export const MIN_PASSWORD_LENGTH = 10;
