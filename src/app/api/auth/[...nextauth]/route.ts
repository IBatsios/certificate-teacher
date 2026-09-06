import type { NextRequest } from "next/server";
import { handlers } from "@/auth";
import { clientAddressFrom } from "@/lib/client-address";
import { isTrustedOrigin, ORIGIN_SECRET_HEADER } from "@/lib/origin";
import { createRateLimiter } from "@/lib/rate-limit";

// Auth.js owns everything under /api/auth: the magic-link callback, the
// credentials sign-in, sign-out, and the session endpoint. These routes sit
// outside the proxy, so they apply the same two guards themselves: only
// Cloudflare may reach them (D44), and one address gets a bounded number of
// sign-in attempts, since a password guesser could post here directly and
// skip the form's own limit (D39).
const POSTS_PER_ADDRESS = 40;
const WINDOW_MS = 15 * 60 * 1000;
const postsByAddress = createRateLimiter({
  limit: POSTS_PER_ADDRESS,
  windowMs: WINDOW_MS,
});

export async function GET(request: NextRequest): Promise<Response> {
  return guard(request) ?? handlers.GET(request);
}

export async function POST(request: NextRequest): Promise<Response> {
  if (!postsByAddress.check(clientAddressFrom(request.headers)).allowed) {
    return new Response(
      "Too many attempts. Wait fifteen minutes and try again.",
      {
        status: 429,
        headers: { "retry-after": String(WINDOW_MS / 1000) },
      },
    );
  }
  return guard(request) ?? handlers.POST(request);
}

function guard(request: NextRequest): Response | null {
  const presented = request.headers.get(ORIGIN_SECRET_HEADER);
  if (isTrustedOrigin(presented, process.env.ORIGIN_SECRET)) {
    return null;
  }
  return new Response("Not available this way.", { status: 403 });
}
