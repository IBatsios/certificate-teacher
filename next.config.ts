import type { NextConfig } from "next";

// Headers every response carries. The Content-Security-Policy is not here
// because it needs a fresh nonce per page; src/proxy.ts sets it (D45).
const SECURITY_HEADERS = [
  // A year of HTTPS-only for this host. Browsers ignore it over plain http.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
