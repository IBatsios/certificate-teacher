import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import {
  signInWithPassword,
  signOut,
  signUpWithPassword,
  uniqueEmail,
} from "./helpers";

const DEPLOY_STEPS = 4;
const CERTIFICATE_STEPS = 5;

const FIRST_DEPLOY_STEP = /Start a real https website/;

function step(page: Page, title: RegExp) {
  return page.getByRole("region", { name: title });
}

function finished(page: Page) {
  return page.getByRole("region", { name: /done|whole course/i });
}

/**
 * Ticks every step still showing a "Mark done" button. Each click redirects
 * back to the page, so the button is looked up again every time round.
 */
async function tickEveryStep(page: Page, count: number): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    await page.getByRole("button", { name: "Mark done" }).first().click();
    await expect(
      page.getByText(`${index + 1} of ${count} steps done`),
    ).toBeVisible();
  }
}

/**
 * Signs up and waits for the student to land, so a later `goto` cannot race
 * the session cookie and get bounced to the sign-in page.
 */
async function signUpAndLand(page: Page): Promise<string> {
  const email = uniqueEmail("student");
  await signUpWithPassword(page, email);
  await expect(page).toHaveURL(/\/lessons\/certificates$/);
  return email;
}

test("a student deploys the certificate, and the course reads complete only once both lessons are", async ({
  page,
}) => {
  await signUpAndLand(page);

  // The first lesson hands the student to the second one.
  await page.goto("/lessons/deploy");
  await expect(page.getByText(`0 of ${DEPLOY_STEPS} steps done`)).toBeVisible();

  await tickEveryStep(page, DEPLOY_STEPS);

  // Every deploy step is ticked, but the first lesson is untouched, so this is
  // the end of a lesson and not the end of the course.
  await expect(finished(page)).toContainText(
    "Every step of this lesson is done",
  );
  await expect(finished(page)).not.toContainText("That is the whole course");

  // Finish the first lesson too.
  await page.goto("/lessons/certificates");
  await tickEveryStep(page, CERTIFICATE_STEPS);

  await page.goto("/lessons/deploy");
  await expect(finished(page)).toContainText("That is the whole course");
  await expect(page.getByRole("link", { name: "take the test" })).toBeVisible();
});

test("deploy progress is kept, and can be undone, like any other lesson", async ({
  page,
}) => {
  const email = await signUpAndLand(page);
  await page.goto("/lessons/deploy");

  await step(page, FIRST_DEPLOY_STEP)
    .getByRole("button", { name: "Mark done" })
    .click();
  await expect(step(page, FIRST_DEPLOY_STEP)).toContainText("Done");

  await signOut(page);
  await signInWithPassword(page, email);
  await expect(page).toHaveURL(/\/lessons\/certificates$/);
  await page.goto("/lessons/deploy");
  await expect(step(page, FIRST_DEPLOY_STEP)).toContainText("Done");

  await step(page, FIRST_DEPLOY_STEP)
    .getByRole("button", { name: "Undo" })
    .click();

  await expect(
    step(page, FIRST_DEPLOY_STEP).getByRole("button", { name: "Mark done" }),
  ).toBeVisible();
  await expect(page.getByText(`0 of ${DEPLOY_STEPS} steps done`)).toBeVisible();
});

test("finishing the first lesson points the student at the second", async ({
  page,
}) => {
  await signUpAndLand(page);
  await tickEveryStep(page, CERTIFICATE_STEPS);

  const next = page.getByRole("link", { name: "the deploy lesson" });
  await expect(next).toBeVisible();
  await next.click();

  await expect(page).toHaveURL(/\/lessons\/deploy$/);
  await expect(
    page.getByRole("heading", { name: "Putting your certificate to work" }),
  ).toBeVisible();
});
