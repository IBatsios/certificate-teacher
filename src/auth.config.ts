import type { NextAuthConfig } from "next-auth";
import { SIGN_IN_PATH } from "@/lib/access";
import { isRole } from "@/lib/roles";

/**
 * The part of the Auth.js configuration that needs no database: pages,
 * session strategy, and the callbacks that put the role on the session. The
 * proxy uses this alone; src/auth.ts adds the adapter and the providers.
 *
 * Sessions are JSON web tokens rather than database rows because the
 * Credentials provider only works that way (see docs/DECISIONS.md).
 */
export const authConfig = {
  pages: {
    signIn: SIGN_IN_PATH,
    verifyRequest: "/check-your-email",
    error: SIGN_IN_PATH,
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      // `user` is present on the request that signs someone in.
      if (user !== undefined) {
        return { ...token, role: user.role };
      }
      return token;
    },
    session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub ?? session.user.id,
          role: isRole(token.role) ? token.role : "student",
        },
      };
    },
  },
} satisfies NextAuthConfig;
