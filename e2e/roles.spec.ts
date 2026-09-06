import { expect, newPage, test } from "./fixtures";
import {
  accountNav,
  pageMessage,
  signInWithLink,
  signInWithPassword,
  signUpWithPassword,
  uniqueEmail,
} from "./helpers";

// The app was started with this address as ADMIN_EMAIL (playwright.config.ts).
// Several tests share the account; a magic link creates it on first use and
// signs in after that.
function adminEmail(): string {
  const email = process.env.E2E_ADMIN_EMAIL;
  if (email === undefined) {
    throw new Error(
      "E2E_ADMIN_EMAIL is not set; run through playwright.config.ts",
    );
  }
  return email;
}

test("a student cannot open the admin pages", async ({ page }) => {
  await signUpWithPassword(page, uniqueEmail("student"));
  await expect(page).toHaveURL(/\/lessons\/certificates$/);

  await page.goto("/admin/users");

  await expect(page).toHaveURL(/\/forbidden$/);
  await expect(page.getByRole("heading")).toContainText("not for your account");
});

test("the admin address cannot be claimed with a password", async ({
  page,
}) => {
  await signUpWithPassword(page, adminEmail());

  await expect(page).toHaveURL(/\/sign-up\?error=admin-by-link$/);
  await expect(pageMessage(page)).toContainText("belongs to the admin");
});

test("the admin signs in by link, lands on the users page, and cannot take the test", async ({
  browser,
}) => {
  const admin = await newPage(browser);

  await signInWithLink(admin, adminEmail());
  await expect(admin).toHaveURL(/\/admin\/users$/);

  await admin.goto("/test");
  await expect(admin).toHaveURL(/\/forbidden$/);
});

test("the admin promotes a student, who is told to sign in again, but cannot change their own role", async ({
  browser,
}) => {
  const studentEmail = uniqueEmail("student");
  const student = await newPage(browser);
  await signUpWithPassword(student, studentEmail);
  await expect(student).toHaveURL(/\/lessons\/certificates$/);

  const admin = await newPage(browser);
  await signInWithLink(admin, adminEmail());
  await expect(admin).toHaveURL(/\/admin\/users$/);

  const studentRow = admin.getByRole("row", { name: studentEmail });
  await expect(studentRow).toContainText("student");
  await studentRow.getByRole("button", { name: "Make admin" }).click();
  await expect(pageMessage(admin)).toContainText("Role changed");
  await expect(admin.getByRole("row", { name: studentEmail })).toContainText(
    "admin",
  );

  // The promoted person still holds a cookie with the old role.
  await student.goto("/test");
  await expect(student).toHaveURL(/\/forbidden$/);
  await expect(student.getByRole("heading")).toContainText("role has changed");
  await student
    .getByRole("main")
    .getByRole("button", { name: "Sign out" })
    .click();
  await expect(
    accountNav(student).getByRole("link", { name: "Sign in" }),
  ).toBeVisible();
  await signInWithPassword(student, studentEmail);
  await expect(student).toHaveURL(/\/admin\/users$/);

  const ownRow = admin.getByRole("row", { name: adminEmail() });
  await ownRow.getByRole("button", { name: "Make student" }).click();
  await expect(pageMessage(admin)).toContainText("your own role");
  await expect(admin.getByRole("row", { name: adminEmail() })).toContainText(
    "admin",
  );
});
