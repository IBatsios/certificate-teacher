/**
 * The visitor's address as Cloudflare reports it. Cloudflare sets this
 * header itself on every request it forwards and ignores any value the
 * client sent, so it is trustworthy as long as only Cloudflare can reach the
 * app, which the origin secret guarantees (D44). Behind no proxy, as in
 * development, the header is absent and everyone shares one address.
 */
export function clientAddressFrom(headers: Headers): string {
  const address = headers.get("cf-connecting-ip")?.trim();
  return address === undefined || address === "" ? "unknown" : address;
}
