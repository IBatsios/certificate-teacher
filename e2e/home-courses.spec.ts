import { expect, test } from "./fixtures";
import { signUpWithPassword, uniqueEmail } from "./helpers";

const CERTIFICATES_COURSE = "HTTPS with your own certificates";
const DOCKER_COURSE = "Docker";

test("a visitor sees both courses and is invited to sign in for each", async ({
  page,
}) => {
  await page.goto("/");

  const courses = page.getByRole("region", { name: "Courses" });
  await expect(courses.getByRole("heading", { level: 3 })).toHaveText([
    CERTIFICATES_COURSE,
    DOCKER_COURSE,
  ]);

  // Both courses exist now, so neither is marked as coming, each says how
  // long it is, and each invites the visitor in.
  await expect(courses.getByText("Coming soon")).toHaveCount(0);
  const docker = courses
    .getByRole("article")
    .filter({ hasText: DOCKER_COURSE });
  await expect(docker).toContainText(/\d+ lessons? and a test/);
  await expect(
    courses.getByRole("link", { name: "Sign in to start" }),
  ).toHaveCount(2);
});

test("a student starts the certificates course from the home page", async ({
  page,
}) => {
  await signUpWithPassword(page, uniqueEmail("home"));
  // Wait for the sign-up to land, so the session cookie is set before the
  // home page is asked what this student can do.
  await expect(page).toHaveURL(/\/lessons\/certificates$/);

  await page.goto("/");
  await page
    .getByRole("article")
    .filter({ hasText: CERTIFICATES_COURSE })
    .getByRole("link", { name: "Go to the lesson" })
    .click();

  await expect(page).toHaveURL(/\/lessons\/certificates$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Certificate chains",
  );
});
