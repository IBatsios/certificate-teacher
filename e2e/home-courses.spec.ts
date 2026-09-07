import { expect, test } from "./fixtures";
import { signUpWithPassword, uniqueEmail } from "./helpers";

const AVAILABLE_COURSE = "HTTPS with your own certificates";

test("a visitor sees what is on offer and what is still coming", async ({
  page,
}) => {
  await page.goto("/");

  const courses = page.getByRole("region", { name: "Courses" });
  await expect(courses.getByRole("heading", { level: 3 })).toHaveText([
    AVAILABLE_COURSE,
    "Kubernetes",
  ]);

  // The course that exists invites them in; the one that does not says so and
  // offers nothing to click.
  const kubernetes = courses
    .getByRole("article")
    .filter({ hasText: "Kubernetes" });
  await expect(kubernetes).toContainText("Coming soon");
  await expect(kubernetes.getByRole("link")).toHaveCount(0);
  await expect(
    courses.getByRole("link", { name: "Sign in to start" }),
  ).toBeVisible();
});

test("a student starts the course from the home page", async ({ page }) => {
  await signUpWithPassword(page, uniqueEmail("home"));
  // Wait for the sign-up to land, so the session cookie is set before the
  // home page is asked what this student can do.
  await expect(page).toHaveURL(/\/lessons\/certificates$/);

  await page.goto("/");
  await page.getByRole("link", { name: "Go to the lesson" }).click();

  await expect(page).toHaveURL(/\/lessons\/certificates$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Certificate chains",
  );
});
