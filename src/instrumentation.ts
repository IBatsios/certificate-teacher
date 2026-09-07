import {
  emailTransport,
  missingEmailVariables,
  missingProductionVariables,
} from "@/lib/env";

/**
 * Runs once when the server starts. A deployment missing a variable it
 * needs fails here, before the health check, so the previous version keeps
 * serving (D41).
 */
export function register(): void {
  const missing = missingProductionVariables(process.env);
  if (missing.length > 0) {
    throw new Error(
      `AUTH_TRUST_HOST is set, so these must be set too: ${missing.join(", ")}. See .env.example.`,
    );
  }

  // Without this the app starts and only fails when someone asks for a
  // sign-in link, which looks like the button doing nothing (D66).
  const missingEmail = missingEmailVariables(process.env);
  if (missingEmail.length > 0) {
    throw new Error(
      `Magic-link email goes out through ${emailTransport(process.env)}, so these must be set too: ${missingEmail.join(", ")}. See .env.example.`,
    );
  }
}
