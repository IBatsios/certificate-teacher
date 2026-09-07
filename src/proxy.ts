import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { decideAccess, FORBIDDEN_PATH } from "@/lib/access";
import { isTrustedOrigin, ORIGIN_SECRET_HEADER } from "@/lib/origin";
import { isRole } from "@/lib/roles";

// The proxy runs on every page request. It only decodes the session cookie,
// read-only: it never writes one back, so nothing that happens here can
// bring a session back after sign-out (D49). The database is never read
// here. Pages and actions check again, closer to the data, through
// src/lib/session.ts.

// Railway's health check reaches the container without going through
// Cloudflare, so the home page stays open to it. It holds nothing private.
const HEALTH_CHECK_PATH = "/";

// Auth.js prefixes the cookie name over HTTPS; behind Railway's proxy the
// surest way to know which name is in play is to look for it.
const SECURE_SESSION_COOKIE = "__Secure-authjs.session-token";

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  if (
    pathname !== HEALTH_CHECK_PATH &&
    !isTrustedOrigin(
      request.headers.get(ORIGIN_SECRET_HEADER),
      process.env.ORIGIN_SECRET,
    )
  ) {
    return new NextResponse("Not available this way.", { status: 403 });
  }

  const decision = decideAccess(pathname, await roleFromCookie(request));

  switch (decision.kind) {
    case "allow":
      return withContentSecurityPolicy(request);
    case "redirect":
      return NextResponse.redirect(new URL(decision.to, request.nextUrl));
    case "forbid":
      return NextResponse.redirect(new URL(FORBIDDEN_PATH, request.nextUrl));
  }
}

/** The role in the session cookie, or null when there is no valid session. */
async function roleFromCookie(request: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  if (secret === undefined || secret === "") {
    return null;
  }
  const token = await getToken({
    req: request,
    secret,
    secureCookie: request.cookies.has(SECURE_SESSION_COOKIE),
  });
  return isRole(token?.role) ? token.role : null;
}

/**
 * A fresh nonce per page, so only scripts Next itself emits can run. The
 * other security headers are static and live in next.config.ts.
 */
function withContentSecurityPolicy(request: NextRequest): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDevelopment = process.env.NODE_ENV === "development";
  const isHttps = request.headers.get("x-forwarded-proto") === "https";
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    // Inline style attributes, such as the progress bar's width, need this.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isHttps ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = {
  // Everything except Auth.js's own routes, which guard themselves in
  // src/app/api/auth/[...nextauth]/route.ts, and static assets.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
