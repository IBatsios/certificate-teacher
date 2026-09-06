"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn } from "@/auth";
import { HOME_BY_ROLE } from "@/lib/access";
import { hashPassword, MIN_PASSWORD_LENGTH } from "@/lib/password";
import { normalizeEmail, roleForNewUser } from "@/lib/roles";
import { allowSignUp } from "@/lib/sign-in-limits";
import { createUserWithPassword, findUserByEmail } from "@/lib/users";
import { signInPageWithMessage } from "../sign-in/messages";
import { signUpPageWithMessage, type SignUpMessageKey } from "./messages";

const signUpFormSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(MIN_PASSWORD_LENGTH),
});

// Prisma's code for a unique constraint violation: two sign-ups with the same
// email at the same moment.
const UNIQUE_VIOLATION = "P2002";

/**
 * Creates a student account, signs the person in, and sends them to the
 * lesson. Only students are created here: typing an address proves nothing,
 * so the admin's account can only come from a magic link (see D30). The
 * address limit runs before the hash, which is the expensive part (D39).
 * Redirects happen outside try/catch because `redirect` throws.
 */
export async function signUpWithPassword(formData: FormData): Promise<void> {
  const parsed = signUpFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    redirect(signUpPageWithMessage(messageKeyFor(parsed.error)));
  }

  if (!(await allowSignUp())) {
    redirect(signUpPageWithMessage("too-many-attempts"));
  }
  const email = normalizeEmail(parsed.data.email);
  const created = await tryCreateUser(email, parsed.data.password);
  if (created.kind === "failed") {
    redirect(signUpPageWithMessage(created.message));
  }

  const signedIn = await trySignIn(email, parsed.data.password);
  if (!signedIn) {
    redirect(signInPageWithMessage("account-ready"));
  }
  redirect(HOME_BY_ROLE.student);
}

function messageKeyFor(error: z.ZodError): SignUpMessageKey {
  const passwordTooShort = error.issues.some(
    (issue) => issue.path[0] === "password" && issue.code === "too_small",
  );
  return passwordTooShort ? "password-too-short" : "missing";
}

type CreateResult =
  | Readonly<{ kind: "created" }>
  | Readonly<{ kind: "failed"; message: SignUpMessageKey }>;

async function tryCreateUser(
  email: string,
  password: string,
): Promise<CreateResult> {
  if (roleForNewUser(email, process.env.ADMIN_EMAIL) === "admin") {
    return { kind: "failed", message: "admin-by-link" };
  }
  if ((await findUserByEmail(email)) !== null) {
    return { kind: "failed", message: "already-registered" };
  }
  try {
    const passwordHash = await hashPassword(password);
    await createUserWithPassword({ email, passwordHash, role: "student" });
    return { kind: "created" };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { kind: "failed", message: "already-registered" };
    }
    console.error("Could not create the account", error);
    return { kind: "failed", message: "not-saved" };
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === UNIQUE_VIOLATION
  );
}

async function trySignIn(email: string, password: string): Promise<boolean> {
  try {
    await signIn("credentials", { email, password, redirect: false });
    return true;
  } catch (error) {
    if (error instanceof AuthError) {
      console.error("Account created but sign-in failed", error);
      return false;
    }
    throw error;
  }
}
