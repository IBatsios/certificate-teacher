import { headers } from "next/headers";
import { clientAddressFrom } from "@/lib/client-address";
import { createRateLimiter, type RateLimiter } from "@/lib/rate-limit";

// Attempts allowed every fifteen minutes. Password attempts are counted per
// email-and-address pair, so a stranger guessing at your account cannot lock
// you out of it, and per address, so one machine cannot spray many accounts.
// Generous enough that a person who mistypes a few times is never caught (D39).
const WINDOW_MS = 15 * 60 * 1000;
const PASSWORD_PER_EMAIL_AND_ADDRESS = 10;
const PASSWORD_PER_ADDRESS = 30;
const LINK_PER_EMAIL_AND_ADDRESS = 5;
const LINK_PER_ADDRESS = 20;
const SIGN_UP_PER_ADDRESS = 10;

const limiters = {
  password: createRateLimiter({
    limit: PASSWORD_PER_EMAIL_AND_ADDRESS,
    windowMs: WINDOW_MS,
  }),
  passwordByAddress: createRateLimiter({
    limit: PASSWORD_PER_ADDRESS,
    windowMs: WINDOW_MS,
  }),
  link: createRateLimiter({
    limit: LINK_PER_EMAIL_AND_ADDRESS,
    windowMs: WINDOW_MS,
  }),
  linkByAddress: createRateLimiter({
    limit: LINK_PER_ADDRESS,
    windowMs: WINDOW_MS,
  }),
  signUpByAddress: createRateLimiter({
    limit: SIGN_UP_PER_ADDRESS,
    windowMs: WINDOW_MS,
  }),
} satisfies Record<string, RateLimiter>;

/** True when one more password attempt for `email` may go ahead. */
export async function allowPasswordAttempt(email: string): Promise<boolean> {
  const address = await clientAddress();
  return (
    limiters.password.check(`${email}|${address}`).allowed &&
    limiters.passwordByAddress.check(address).allowed
  );
}

/** True when one more sign-in link for `email` may be sent. */
export async function allowSignInLink(email: string): Promise<boolean> {
  const address = await clientAddress();
  return (
    limiters.link.check(`${email}|${address}`).allowed &&
    limiters.linkByAddress.check(address).allowed
  );
}

/** True when one more account may be created from this address. */
export async function allowSignUp(): Promise<boolean> {
  const address = await clientAddress();
  return limiters.signUpByAddress.check(address).allowed;
}

async function clientAddress(): Promise<string> {
  return clientAddressFrom(await headers());
}
