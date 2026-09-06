import { expect, test } from "@playwright/test";
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

test("a sign-in link works only once", async ({ page, context }) => {
  const email = uniqueEmail("link");
  await requestSignInLink(page, email);
  const link = await waitForSignInLink(email);
  await page.goto(link);
  await expect(page).toHaveURL(/\/lessons\/certificates$/);
  await context.clearCookies();

  await page.goto(link);

  await expect(page).toHaveURL(/\/sign-in\?error=Verification$/);
  await expect(pageMessage(page)).toContainText("expired or was already used");
});
