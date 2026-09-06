"use server";

import { signOut } from "@/auth";

/** Ends the session and returns to the home page. `signOut` redirects itself. */
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
