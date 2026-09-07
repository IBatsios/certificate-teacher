/** Which provider sends magic-link email. The names are Auth.js provider ids. */
export type EmailTransport = "resend" | "nodemailer";

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

function isSet(value: string | undefined): boolean {
  return value !== undefined && value.trim() !== "";
}
