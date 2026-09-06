import { expect, newPage, test } from "./fixtures";
import {
  accountNav,
  pageMessage,
  requestSignInLink,
  uniqueEmail,
  waitForSignInLink,
} from "./helpers";

test("a new person signs in with a link sent by email", async ({ page }) => {
  const email = uniqueEmail("link");

  await requestSignInLink(page, email);
  await expect(page).toHaveURL(/\/check-your-email$/);

  const link = await waitForSignInLink(email);
  await page.goto(link);

  await expect(page).toHaveURL(/\/lessons\/certificates$/);
  await expect(
    accountNav(page).getByRole("link", { name: email }),
  ).toBeVisible();
});

test("a sign-in link works only once", async ({ page, browser }) => {
  const email = uniqueEmail("link");
  await requestSignInLink(page, email);
  const link = await waitForSignInLink(email);
  await page.goto(link);
  await expect(page).toHaveURL(/\/lessons\/certificates$/);

  // A second browser, with no cookies, tries the same link. (Clearing this
  // context's cookies would race a prefetch that re-sets the session.)
  const other = await newPage(browser);
  await other.goto(link);

  await expect(other).toHaveURL(/\/sign-in\?error=Verification$/);
  await expect(pageMessage(other)).toContainText("expired or was already used");
});
