import { expect, test } from "@playwright/test";
import { originSecretHeader } from "./fixtures";

// The app runs with an origin secret during these tests (playwright.config.ts),
// standing in for the header Cloudflare adds in production (D44).

test("a request that skipped Cloudflare is refused, except the health check", async ({
  request,
}) => {
  const signIn = await request.get("/sign-in", {
    headers: { "x-origin-secret": "" },
  });
  const authRoute = await request.get("/api/auth/csrf", {
    headers: { "x-origin-secret": "" },
  });
  const health = await request.get("/", { headers: { "x-origin-secret": "" } });

  expect(signIn.status()).toBe(403);
  expect(authRoute.status()).toBe(403);
  expect(health.status()).toBe(200);
});

test("a request through Cloudflare carries the security headers", async ({
  request,
}) => {
  const response = await request.get("/sign-in", {
    headers: originSecretHeader(),
  });

  expect(response.status()).toBe(200);
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain(
    "script-src 'self' 'nonce-",
  );
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-powered-by"]).toBeUndefined();
});
