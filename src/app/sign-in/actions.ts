"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn } from "@/auth";
import { HOME_BY_ROLE, SIGN_IN_PATH } from "@/lib/access";
import { normalizeEmail } from "@/lib/roles";
import { findUserByEmail } from "@/lib/users";
import { signInPageWithMessage } from "./messages";

const passwordFormSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const emailFormSchema = z.object({
  email: z.string().trim().email(),
});

/**
 * Email and password. Auth.js checks the password (src/auth.ts) and sets the
 * session cookie; then the person goes to their role's home page. Redirects
 * happen outside try/catch because `redirect` throws.
 */
export async function signInWithPassword(formData: FormData): Promise<void> {
  const parsed = passwordFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    redirect(signInPageWithMessage("missing"));
  }

  const email = normalizeEmail(parsed.data.email);
  const signedIn = await trySignInWithPassword(email, parsed.data.password);
  if (!signedIn) {
    redirect(signInPageWithMessage("wrong-password"));
  }

  const user = await findUserByEmail(email);
  redirect(HOME_BY_ROLE[user?.role ?? "student"]);
}

async function trySignInWithPassword(
  email: string,
  password: string,
): Promise<boolean> {
  try {
    await signIn("credentials", { email, password, redirect: false });
    return true;
  } catch (error) {
    if (error instanceof AuthError) {
      return false;
    }
    throw error;
  }
}

/**
 * Magic link. Auth.js stores a one-time token and emails the link. Following
 * it signs the person in (creating the account on first use) and lands on the
 * sign-in page, which the proxy turns into their home page.
 */
export async function sendSignInLink(formData: FormData): Promise<void> {
  const parsed = emailFormSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    redirect(signInPageWithMessage("missing-email"));
  }

  const sent = await trySendSignInLink(normalizeEmail(parsed.data.email));
  if (!sent) {
    redirect(signInPageWithMessage("link-not-sent"));
  }

  redirect("/check-your-email");
}

async function trySendSignInLink(email: string): Promise<boolean> {
  try {
    await signIn("nodemailer", {
      email,
      redirect: false,
      redirectTo: SIGN_IN_PATH,
    });
    return true;
  } catch (error) {
    console.error("Could not send the sign-in link", error);
    return false;
  }
}
