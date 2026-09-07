import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import {
  signInWithLink,
  signOut,
  signUpWithPassword,
  uniqueEmail,
} from "./helpers";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@e2e.test";

/** Signs up a student and leaves them signed out again. */
async function aStudentWhoHasSignedUp(page: Page): Promise<string> {
  const email = uniqueEmail("student");
  await signUpWithPassword(page, email);
  await expect(page).toHaveURL(/\/lessons\/certificates$/);
  await signOut(page);
  return email;
}

test("a student cannot open the report or the export", async ({ page }) => {
  // Arrange
  const email = uniqueEmail("student");
  await signUpWithPassword(page, email);
  await expect(page).toHaveURL(/\/lessons\/certificates$/);

  // Act and assert: the page.
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/forbidden$/);

  // And the export, which guards itself rather than trusting the proxy.
  await page.goto("/api/admin/export");
  await expect(page).toHaveURL(/\/forbidden$/);
  // The forbidden page does show this student their own address, so the thing
  // to check is that no report was served: its header would be here if it had.
  await expect(page.getByRole("main")).not.toContainText("focus areas");

  // Asking for it directly is refused too, rather than merely redirected in
  // the browser.
  const direct = await page.request.get("/api/admin/export", {
    maxRedirects: 0,
  });
  expect(direct.status()).toBeGreaterThanOrEqual(300);
  expect(await direct.text()).not.toContain("focus areas");
});

test("someone signed out cannot open the export", async ({ page }) => {
  await page.goto("/api/admin/export");

  await expect(page).toHaveURL(/\/sign-in$/);
});

test("the admin sees a student's progress and can download it", async ({
  page,
}) => {
  // Arrange: a student who has signed up but done nothing else.
  const studentEmail = await aStudentWhoHasSignedUp(page);

  // Act
  await signInWithLink(page, ADMIN_EMAIL);
  await page.goto("/admin");

  // Assert: the student is listed.
  const row = page.getByRole("row").filter({ hasText: studentEmail });
  await expect(row).toBeVisible();
  await expect(row).toContainText("not submitted");

  // And the download works, with the file named for a spreadsheet.
  const download = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Download as a spreadsheet" }).click(),
  ]).then(([event]) => event);

  expect(download.suggestedFilename()).toMatch(
    /^teacher-progress-\d{4}-\d{2}-\d{2}\.csv$/,
  );
});

test("the exported file holds the student, with a header and no formula", async ({
  page,
}) => {
  // Arrange
  const studentEmail = await aStudentWhoHasSignedUp(page);
  await signInWithLink(page, ADMIN_EMAIL);

  // Act: fetch the export through the signed-in browser session.
  const response = await page.request.get("/api/admin/export");

  // Assert
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/csv");
  expect(response.headers()["content-disposition"]).toContain("attachment");

  const csv = await response.text();
  expect(csv.split("\r\n")[0]).toContain("focus areas");
  expect(csv).toContain(studentEmail);
  // No cell may begin with a character a spreadsheet reads as a formula.
  for (const line of csv.trimEnd().split("\r\n")) {
    for (const cell of line.split(",")) {
      expect(cell.replace(/^"/, "")[0] ?? "").not.toMatch(/[=+\-@]/);
    }
  }
});

test("the roles page points the admin at the report", async ({ page }) => {
  await signInWithLink(page, ADMIN_EMAIL);
  await expect(page).toHaveURL(/\/admin\/users$/);

  await page.getByRole("link", { name: "Progress and results" }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.getByRole("heading", { name: "Progress and results" }),
  ).toBeVisible();
});

/**
 * The whole chain, with a real account. Sign-up accepts an address beginning
 * with `+`, and a spreadsheet reads a cell beginning with `+` as a formula, so
 * without the export defusing it the admin opening the file would be running
 * something a student chose.
 */
test("an email a spreadsheet would treat as a formula is defused in the export", async ({
  page,
}) => {
  // Arrange: a student signs up with an address starting with a plus.
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const formulaEmail = `+49-${stamp}@e2e.test`;
  await signUpWithPassword(page, formulaEmail);
  await expect(page).toHaveURL(/\/lessons\/certificates$/);
  await signOut(page);

  // Act
  await signInWithLink(page, ADMIN_EMAIL);
  const csv = await (await page.request.get("/api/admin/export")).text();

  // Assert: the address is there to read, but not as a formula.
  expect(csv).toContain(formulaEmail);
  const line = csv
    .split("\r\n")
    .find((candidate) => candidate.includes(formulaEmail));
  expect(line).toBeDefined();
  expect(line?.startsWith("+")).toBe(false);
  expect(line?.replace(/^"/, "").startsWith("'")).toBe(true);
});
