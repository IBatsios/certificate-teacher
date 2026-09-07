import { headers } from "next/headers";
import { clientAddressFrom } from "@/lib/client-address";
import { createRateLimiter, type RateLimiter } from "@/lib/rate-limit";

// Checking a certificate reads two files and does a signature verification, so
// it is worth a limit even though every caller is signed in. Counted per
// student and per address: the first stops one account looping, the second
// stops one machine cycling accounts. Loose enough that a student fixing their
// certificate and trying again is never caught (D39 sets the shape).
const WINDOW_MS = 15 * 60 * 1000;
const CHECKS_PER_STUDENT = 30;
const CHECKS_PER_ADDRESS = 60;

const limiters = {
  byStudent: createRateLimiter({
    limit: CHECKS_PER_STUDENT,
    windowMs: WINDOW_MS,
  }),
  byAddress: createRateLimiter({
    limit: CHECKS_PER_ADDRESS,
    windowMs: WINDOW_MS,
  }),
} satisfies Record<string, RateLimiter>;

/**
 * The decision itself, given who is asking and where from. Split out from the
 * request so it can be tested: `headers()` only works inside one, which is why
 * the wiring underneath a limiter usually goes unchecked.
 *
 * Both counters are always consulted, never short-circuited, so one attempt
 * counts once against each.
 */
export function allowCertificateCheckFrom(
  userId: string,
  address: string,
): boolean {
  const student = limiters.byStudent.check(userId).allowed;
  const from = limiters.byAddress.check(address).allowed;
  return student && from;
}

/** True when this student may have one more certificate checked. */
export async function allowCertificateCheck(userId: string): Promise<boolean> {
  return allowCertificateCheckFrom(userId, clientAddressFrom(await headers()));
}

/** The limits, for the tests and for anything that reports them. */
export const CERTIFICATE_CHECK_LIMITS = {
  perStudent: CHECKS_PER_STUDENT,
  perAddress: CHECKS_PER_ADDRESS,
  windowMs: WINDOW_MS,
} as const;
