import { expect, test } from "./fixtures";
import { signUpWithPassword, uniqueEmail } from "./helpers";

// One route serves every lesson, so an address under /lessons/ that no course
// claims has to be turned away by the route itself: a 404, not a crash and not
// a lesson page with no steps. A visitor who is not signed in never reaches
// the route: everything under /lessons/ sends them to sign in first, as it
// did when each lesson was its own directory.

test("a lesson no course has is a 404 for a student, and sign-in for a visitor", async ({
  page,
}) => {
  await page.goto("/lessons/kubernetes");
  await expect(page).toHaveURL(/\/sign-in/);

  await signUpWithPassword(page, uniqueEmail("route"));
  await expect(page).toHaveURL(/\/lessons\/certificates$/);

  const response = await page.goto("/lessons/kubernetes");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("button", { name: "Mark done" })).toHaveCount(0);
});
