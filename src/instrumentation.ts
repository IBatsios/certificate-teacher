import { missingProductionVariables } from "@/lib/env";

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
}
