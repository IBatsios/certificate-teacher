import { Client } from "pg";

// The e2e accounts all end in @e2e.test (see helpers.ts and
// playwright.config.ts). Deleting a user cascades to their test attempts.
//
// This talks to Postgres through the `pg` driver rather than the Prisma
// client: Playwright's runner loads files as CommonJS, and the generated
// client uses `import.meta`, which CommonJS cannot parse.
export default async function globalTeardown(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString === undefined) {
    throw new Error(
      "DATABASE_URL is not set; the e2e accounts were not removed.",
    );
  }
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(`DELETE FROM "User" WHERE email LIKE '%@e2e.test'`);
  } finally {
    await client.end();
  }
}
