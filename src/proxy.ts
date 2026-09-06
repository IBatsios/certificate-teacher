import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/auth.config";
import { decideAccess, FORBIDDEN_PATH } from "@/lib/access";
import { isTrustedOrigin, ORIGIN_SECRET_HEADER } from "@/lib/origin";

// The proxy runs on every page request. It only decodes the session cookie;
// the database is never read here. Pages and actions check again, closer to
// the data, through src/lib/session.ts.
const { auth } = NextAuth(authConfig);

// Railway's health check reaches the container without going through
// Cloudflare, so the home page stays open to it. It holds nothing private.
const HEALTH_CHECK_PATH = "/";

export const proxy = auth((request) => {
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

  const role = request.auth?.user.role ?? null;
  const decision = decideAccess(pathname, role);

  switch (decision.kind) {
    case "allow":
      return withContentSecurityPolicy(request);
    case "redirect":
      return NextResponse.redirect(new URL(decision.to, request.nextUrl));
    case "forbid":
      return NextResponse.redirect(new URL(FORBIDDEN_PATH, request.nextUrl));
  }
});

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
