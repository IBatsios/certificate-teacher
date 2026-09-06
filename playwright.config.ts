import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

// The browser tests start their own copy of the app on this port so they never
// collide with `pnpm dev` (port 3000 belongs to another app on the developer's
// machine; see docs/handoff-items/handoff-after-task-01.md).
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

// Each run gets its own admin, so runs never collide with each other or with
// the developer's real admin account in the same development database. The
// accounts end in @e2e.test and global-teardown.ts removes them.
const runId = Date.now().toString(36);
process.env.E2E_ADMIN_EMAIL ??= `admin-${runId}@e2e.test`;

export default defineConfig({
  testDir: "e2e",
  // The tests share one database, so they run one at a time.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: process.env.CI ? `pnpm start -p ${PORT}` : `pnpm dev -p ${PORT}`,
    url: `${BASE_URL}/`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ADMIN_EMAIL: process.env.E2E_ADMIN_EMAIL,
      // `next start` is production mode, where Auth.js refuses a host it was
      // not told about. Railway needs the same setting (Task 08).
      AUTH_TRUST_HOST: "true",
    },
  },
});
