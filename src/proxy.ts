import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { decideAccess, FORBIDDEN_PATH } from "@/lib/access";

// The proxy runs on every page request. It only decodes the session cookie;
// the database is never read here. Pages and actions check again, closer to
// the data, through src/lib/session.ts.
const { auth } = NextAuth(authConfig);

export const proxy = auth((request) => {
  const role = request.auth?.user.role ?? null;
  const decision = decideAccess(request.nextUrl.pathname, role);

  switch (decision.kind) {
    case "allow":
      return NextResponse.next();
    case "redirect":
      return NextResponse.redirect(new URL(decision.to, request.nextUrl));
    case "forbid":
      return NextResponse.redirect(new URL(FORBIDDEN_PATH, request.nextUrl));
  }
});

export const config = {
  // Everything except Auth.js's own routes and static assets. Other routes
  // under /api, if any arrive, get the same optimistic check as pages.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
