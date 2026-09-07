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

/** True when this student may have one more certificate checked. */
export async function allowCertificateCheck(userId: string): Promise<boolean> {
  const address = clientAddressFrom(await headers());
  return (
    limiters.byStudent.check(userId).allowed &&
    limiters.byAddress.check(address).allowed
  );
}
