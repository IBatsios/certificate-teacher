import { expect, test } from "@playwright/test";
import {
  accountNav,
  pageMessage,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  uniqueEmail,
} from "./helpers";

test("a new student signs up with a password, signs out, and signs back in", async ({
  page,
}) => {
  const email = uniqueEmail("student");

  await signUpWithPassword(page, email);
  await expect(page).toHaveURL(/\/lessons\/certificates$/);
  await expect(
    accountNav(page).getByRole("link", { name: email }),
  ).toBeVisible();

  await signOut(page);
  await page.goto("/test");
  await expect(page).toHaveURL(/\/sign-in$/);

  await signInWithPassword(page, email);
  await expect(page).toHaveURL(/\/lessons\/certificates$/);
  await expect(
    accountNav(page).getByRole("link", { name: email }),
  ).toBeVisible();
});

test("a wrong password is refused with a plain message", async ({ page }) => {
  const email = uniqueEmail("student");
  await signUpWithPassword(page, email);
  await signOut(page);

  await signInWithPassword(page, email, "not the password");

  await expect(page).toHaveURL(/\/sign-in\?error=wrong-password$/);
  await expect(pageMessage(page)).toContainText("do not match");
});

test("signing up twice with the same email is refused", async ({ page }) => {
  const email = uniqueEmail("student");
  await signUpWithPassword(page, email);
  await signOut(page);

  await signUpWithPassword(page, email);

  await expect(page).toHaveURL(/\/sign-up\?error=already-registered$/);
  await expect(pageMessage(page)).toContainText("already has an account");
});
