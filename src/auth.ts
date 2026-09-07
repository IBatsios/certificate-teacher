import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import Nodemailer from "next-auth/providers/nodemailer";
import Resend from "next-auth/providers/resend";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { emailTransport } from "@/lib/env";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, roleForNewUser } from "@/lib/roles";
import { findUserByEmail } from "@/lib/users";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: withRoleForNewUsers(PrismaAdapter(prisma)),
  providers: [
    // Magic link. The adapter stores the one-time token; how the email
    // leaves the app depends on the environment (D66).
    emailProvider(),
    // Email and password. Sign-up creates the user with a hash first
    // (src/app/sign-up/actions.ts); this only checks the password.
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) {
          return null;
        }
        const user = await findUserByEmail(normalizeEmail(parsed.data.email));
        if (user === null || user.passwordHash === null) {
          return null;
        }
        const matches = await verifyPassword(
          user.passwordHash,
          parsed.data.password,
        );
        return matches
          ? { id: user.id, email: user.email, role: user.role }
          : null;
      },
    }),
  ],
});

/**
 * Users created by Auth.js (the first magic link for a new email) get their
 * role from the same rule as sign-up with a password.
 */
function withRoleForNewUsers(adapter: Adapter): Adapter {
  const createUser = adapter.createUser;
  if (createUser === undefined) {
    return adapter;
  }
  return {
    ...adapter,
    createUser(user: AdapterUser) {
      const role = roleForNewUser(user.email, process.env.ADMIN_EMAIL);
      return createUser({ ...user, email: normalizeEmail(user.email), role });
    },
  };
}

/**
 * The magic-link provider the environment asks for (D66). Resend's HTTPS API
 * in production, because Railway disables outbound SMTP below the Pro plan;
 * Nodemailer over SMTP otherwise, which is Mailpit in development and in the
 * browser tests. Both are Auth.js email providers, so nothing downstream
 * changes but the id.
 */
function emailProvider() {
  const from = requireEnv("EMAIL_FROM");
  if (emailTransport(process.env) === "resend") {
    return Resend({ apiKey: requireEnv("AUTH_RESEND_KEY"), from });
  }
  return Nodemailer({ server: requireEnv("EMAIL_SERVER"), from });
}

function requireEnv(
  name: "EMAIL_SERVER" | "EMAIL_FROM" | "AUTH_RESEND_KEY",
): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(
      `${name} is not set. Copy .env.example to .env and fill it in (see docs/RUNBOOK.md, step 0.3).`,
    );
  }
  return value;
}
