import { defineConfig } from "vitest/config";

// Unit tests and the data-access tests. They run in Node; the data-access
// tests need the compose database (see README). End-to-end tests live under
// e2e/ and are run by Playwright.
export default defineConfig({
  resolve: {
    // Honour the "@/*" alias from tsconfig.json.
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
