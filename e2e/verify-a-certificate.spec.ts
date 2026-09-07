import { readFileSync } from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { pageMessage, signUpWithPassword, uniqueEmail } from "./helpers";

const FIXTURES = path.join(process.cwd(), "src", "lib", "__fixtures__");

function fixture(name: string): string {
  return readFileSync(path.join(FIXTURES, name), "utf8");
}

const goodRoot = fixture("good-root.crt");
const goodLeaf = fixture("good-leaf.crt");
const expiredLeaf = fixture("expired-leaf.crt");

/** No key material is committed, so the refusal case is built here. */
const FAKE_KEY_BLOCK = [
  "-----BEGIN PRIVATE KEY-----",
  "bm90IGEgcmVhbCBrZXksIGp1c3QgZW5vdWdoIHRvIGxvb2sgbGlrZSBvbmU=",
  "-----END PRIVATE KEY-----",
].join("\n");

function result(page: Page) {
  return page.getByRole("region", {
    name: /what the lesson asked for|Not quite yet/,
  });
}

/** Pastes both certificates and submits, which needs no file on disk. */
async function submit(page: Page, root: string, leaf: string): Promise<void> {
  for (const details of await page.getByText("Or paste it instead").all()) {
    await details.click();
  }
  await page.locator('textarea[name="rootText"]').fill(root);
  await page.locator('textarea[name="leafText"]').fill(leaf);
  await page.getByRole("button", { name: "Check them" }).click();
}

async function signUpAndOpenVerify(page: Page): Promise<void> {
  await signUpWithPassword(page, uniqueEmail("student"));
  await expect(page).toHaveURL(/\/lessons\/certificates$/);
  await page.goto("/lessons/verify");
}

test("a student submits the pair from the lesson and is told it passes", async ({
  page,
}) => {
  await signUpAndOpenVerify(page);

  await submit(page, goodRoot, goodLeaf);

  await expect(result(page)).toContainText("what the lesson asked for");
  await expect(result(page)).toContainText("CN=localhost");
  await expect(result(page)).toContainText("CN=My Root");
});

test("an expired certificate is failed, and the page says what to do", async ({
  page,
}) => {
  await signUpAndOpenVerify(page);

  await submit(page, goodRoot, expiredLeaf);

  await expect(result(page)).toContainText("Not quite yet");
  await expect(result(page)).toContainText("expired or not valid yet");
});

/**
 * The one that matters most: a private key must be refused, and nothing about
 * the submission kept. The page says so in as many words.
 */
test("a private key is refused and nothing is kept", async ({ page }) => {
  await signUpAndOpenVerify(page);

  await submit(page, goodRoot, `${goodLeaf}\n${FAKE_KEY_BLOCK}\n`);

  await expect(pageMessage(page)).toContainText("private key");
  await expect(pageMessage(page)).toContainText("nothing was kept");
  // No verdict was reached, so no result is shown at all.
  await expect(result(page)).toHaveCount(0);
});

test("something that is not a certificate is refused in plain words", async ({
  page,
}) => {
  await signUpAndOpenVerify(page);

  await submit(page, goodRoot, "here is my certificate, please check it");

  await expect(pageMessage(page)).toContainText("could not be read");
  // OpenSSL's own wording never reaches the student.
  await expect(page.getByRole("main")).not.toContainText("PEM routines");
});

test("the first lesson points a finished student at the check", async ({
  page,
}) => {
  await signUpWithPassword(page, uniqueEmail("student"));
  await expect(page).toHaveURL(/\/lessons\/certificates$/);
  for (let index = 0; index < 5; index += 1) {
    await page.getByRole("button", { name: "Mark done" }).first().click();
    // Each tick redirects; wait for it before clicking the next one.
    await expect(page.getByText(`${index + 1} of 5 steps done`)).toBeVisible();
  }

  const link = page.getByRole("link", {
    name: "have your certificate checked",
  });
  await expect(link).toBeVisible();
  await link.click();

  await expect(page).toHaveURL(/\/lessons\/verify$/);
});
