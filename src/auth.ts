import { PrismaAdapter } from "@auth/prisma-adapter";
import { createTransport } from "nodemailer";
import NextAuth from "next-auth";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import type { EmailProviderSendVerificationRequestParams } from "next-auth/providers/email";
import Nodemailer from "next-auth/providers/nodemailer";
import Resend from "next-auth/providers/resend";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { emailTransport } from "@/lib/env";
import { SIGN_IN_LINK_MAX_AGE_SECONDS, signInEmail } from "@/lib/sign-in-email";
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
  const maxAge = SIGN_IN_LINK_MAX_AGE_SECONDS;
  if (emailTransport(process.env) === "resend") {
    const apiKey = requireEnv("AUTH_RESEND_KEY");
    return Resend({
      apiKey,
      from,
      maxAge,
      sendVerificationRequest: (params) => sendWithResend(params, apiKey, from),
    });
  }
  const server = requireEnv("EMAIL_SERVER");
  return Nodemailer({
    server,
    from,
    maxAge,
    sendVerificationRequest: (params) =>
      sendWithNodemailer(params, server, from),
  });
}

/** The message both transports send, built from the link Auth.js minted. */
function contentFor(params: EmailProviderSendVerificationRequestParams) {
  return signInEmail({ url: params.url, host: new URL(params.url).host });
}

async function sendWithResend(
  params: EmailProviderSendVerificationRequestParams,
  apiKey: string,
  from: string,
): Promise<void> {
  const { subject, text, html } = contentFor(params);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: params.identifier, subject, text, html }),
  });
  // Auth.js turns a throw here into the "we could not send it" message the
  // sign-in page shows, and src/app/sign-in/actions.ts logs the reason.
  if (!response.ok) {
    throw new Error(
      `Resend refused the sign-in email: ${response.status} ${await response.text()}`,
    );
  }
}

async function sendWithNodemailer(
  params: EmailProviderSendVerificationRequestParams,
  server: string,
  from: string,
): Promise<void> {
  const { subject, text, html } = contentFor(params);
  await createTransport(server).sendMail({
    to: params.identifier,
    from,
    subject,
    text,
    html,
  });
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
