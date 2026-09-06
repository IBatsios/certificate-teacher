import { timingSafeEqual } from "node:crypto";

export const ORIGIN_SECRET_HEADER = "x-origin-secret";

/**
 * Whether a request came through Cloudflare. A transform rule there adds the
 * secret to every request; anything that reaches Railway without it did not
 * come that way (D44). With no secret configured, as in development, every
 * request is trusted.
 */
export function isTrustedOrigin(
  presented: string | null,
  secret: string | undefined,
): boolean {
  if (secret === undefined || secret === "") {
    return true;
  }
  if (presented === null) {
    return false;
  }
  const expected = Buffer.from(secret);
  const given = Buffer.from(presented);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
