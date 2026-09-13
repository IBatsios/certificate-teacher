// Which variables the app needs, and what it needs them for. Pure: it reads
// the record it is given, never process.env, and it imports nothing from
// Node. That last part matters because src/instrumentation.ts runs the
// checks below at startup and Next compiles it for the Edge runtime as well
// as for Node, so anything reachable from here has to load there too (D75).
// src/instrumentation.test.ts walks the imports to keep it that way.

/** Which provider sends magic-link email. The names are Auth.js provider ids. */
export type EmailTransport = "resend" | "nodemailer";

/**
 * The variable holding the key every student's challenge token is derived
 * from; a long random string, in `.env.example`. Named here rather than in
 * `src/lib/challenge-token.ts`, which derives the tokens and needs Node's
 * crypto for it, so the startup check can ask for the key without pulling
 * crypto into the Edge bundle.
 */
export const CHALLENGE_TOKEN_KEY_VARIABLE = "CHALLENGE_TOKEN_KEY";

// What each transport needs besides the variable that selects it.
const VARIABLES_BY_TRANSPORT: Readonly<
  Record<EmailTransport, ReadonlyArray<string>>
> = {
  resend: ["EMAIL_FROM"],
  nodemailer: ["EMAIL_SERVER", "EMAIL_FROM"],
};

/**
 * Variables that must travel together in production. AUTH_TRUST_HOST marks
 * a deployment behind a proxy; once it is set, Auth.js needs AUTH_URL to
 * build links instead of trusting the Host header, and the app needs the
 * origin secret so only Cloudflare can reach it (D44). Returns the names
 * that are missing.
 */
export function missingProductionVariables(
  env: Readonly<Record<string, string | undefined>>,
): ReadonlyArray<string> {
  if (!isSet(env.AUTH_TRUST_HOST)) {
    return [];
  }
  return ["AUTH_URL", "ORIGIN_SECRET"].filter((name) => !isSet(env[name]));
}

/**
 * How magic-link email leaves the app. Setting AUTH_RESEND_KEY switches to
 * Resend's HTTPS API, which is the only route that works in production:
 * Railway disables outbound SMTP below the Pro plan (D66). Without the key
 * it stays on SMTP, so development and the browser tests keep reading their
 * mail from Mailpit and need no account (D18).
 */
export function emailTransport(
  env: Readonly<Record<string, string | undefined>>,
): EmailTransport {
  return isSet(env.AUTH_RESEND_KEY) ? "resend" : "nodemailer";
}

/** The names the chosen transport still lacks, in the order to report them. */
export function missingEmailVariables(
  env: Readonly<Record<string, string | undefined>>,
): ReadonlyArray<string> {
  return VARIABLES_BY_TRANSPORT[emailTransport(env)].filter(
    (name) => !isSet(env[name]),
  );
}

/**
 * The variable the Docker course cannot run without: the key that every
 * student's challenge token is derived from (`src/lib/challenge-token.ts`).
 * Needed in every environment, development included, because the lesson
 * page that shows the token has no safe answer without it. Returns the name
 * when it is missing, so the startup check can say so.
 */
export function missingChallengeTokenVariables(
  env: Readonly<Record<string, string | undefined>>,
): ReadonlyArray<string> {
  return isSet(env[CHALLENGE_TOKEN_KEY_VARIABLE])
    ? []
    : [CHALLENGE_TOKEN_KEY_VARIABLE];
}

function isSet(value: string | undefined): boolean {
  return value !== undefined && value.trim() !== "";
}
