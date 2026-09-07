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
    // One test file at a time. The data-access tests share one development
    // database and run their writes at serializable isolation, so two files
    // running together produce write conflicts that say nothing about the
    // code. The whole suite takes a couple of seconds either way.
    fileParallelism: false,
  },
});
