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

function isSet(value: string | undefined): boolean {
  return value !== undefined && value.trim() !== "";
}
