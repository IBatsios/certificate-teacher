import { defineConfig } from "vitest/config";

// Unit tests only. They run in Node against pure functions and data-access
// modules; end-to-end tests live under e2e/ and are run by Playwright.
export default defineConfig({
  resolve: {
    // Honour the "@/*" alias from tsconfig.json.
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
