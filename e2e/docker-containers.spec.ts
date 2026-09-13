import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import {
  pageMessage,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  uniqueEmail,
} from "./helpers";

const CONTAINER_STEPS = 5;
const CERTIFICATE_STEPS = 5;

const FIRST_CONTAINER_STEP = /Run one/;
const FIRST_CERTIFICATE_STEP = /What a certificate chain is/;

function step(page: Page, title: RegExp) {
  return page.getByRole("region", { name: title });
}

function finished(page: Page) {
  return page.getByRole("region", { name: /done|whole course/i });
}

function earlierSessions(page: Page) {
  return page.getByRole("region", { name: "Earlier sessions" });
}

/**
 * The header's count, read from the progress bar rather than its text: once
 * a run has been set aside, "1 of 5 steps done" can appear under "Earlier
 * sessions" too.
 */
async function expectProgress(page: Page, done: number): Promise<void> {
  await expect(
    page.getByRole("progressbar", { name: "Lesson progress" }),
  ).toHaveAttribute("aria-valuenow", String(done));
}

/**
 * Ticks every step still showing a "Mark done" button. Each click redirects
 * back to the page, so the button is looked up again every time round.
 */
async function tickRemainingSteps(
  page: Page,
  alreadyDone: number,
  total: number,
): Promise<void> {
  for (let count = alreadyDone + 1; count <= total; count += 1) {
    await page.getByRole("button", { name: "Mark done" }).first().click();
    await expectProgress(page, count);
  }
}

/**
 * Signs up and waits for the student to land, so a later `goto` cannot race
 * the session cookie and get bounced to the sign-in page.
 */
async function signUpAndLand(page: Page): Promise<string> {
  const email = uniqueEmail("docker");
  await signUpWithPassword(page, email);
  await expect(page).toHaveURL(/\/lessons\/certificates$/);
  return email;
}

test("a student opens the Docker course from the home page, works through lesson 1, and every tick is kept", async ({
  page,
}) => {
  const email = await signUpAndLand(page);

  await page.goto("/");
  await page
    .getByRole("article")
    .filter({ hasText: "Docker" })
    .getByRole("link", { name: "Go to the lesson" })
    .click();

  await expect(page).toHaveURL(/\/lessons\/containers$/);
  await expect(page.getByText("Lesson 1", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "What a container actually is",
  );
  await expectProgress(page, 0);

  // The first step carries the way out for a student who cannot install
  // Docker Desktop, and says how long a borrowed machine lasts.
  await expect(step(page, FIRST_CONTAINER_STEP)).toContainText("one hour");

  // Commands typed inside the container are labelled as such, so a Windows
  // reader does not run `ps` or `exit` in PowerShell itself.
  await expect(step(page, /Get inside one/)).toContainText(
    "Inside the container",
  );

  // A tick survives a reload.
  await step(page, FIRST_CONTAINER_STEP)
    .getByRole("button", { name: "Mark done" })
    .click();
  await expect(step(page, FIRST_CONTAINER_STEP)).toContainText("Done");
  await page.reload();
  await expect(step(page, FIRST_CONTAINER_STEP)).toContainText("Done");
  await expectProgress(page, 1);

  // The rest survive signing out and back in. Lesson 2 is not written yet,
  // so the note names it without linking to it.
  await tickRemainingSteps(page, 1, CONTAINER_STEPS);
  await expect(finished(page)).toContainText(
    "Every step of this lesson is done",
  );
  await expect(finished(page)).toContainText("Lesson 2");
  await expect(finished(page).getByRole("link")).toHaveCount(0);

  await signOut(page);
  await signInWithPassword(page, email);
  await expect(page).toHaveURL(/\/lessons\/certificates$/);
  await page.goto("/lessons/containers");
  await expectProgress(page, CONTAINER_STEPS);
  await expect(finished(page)).toBeVisible();
});

test("starting over on one course leaves the other course's progress alone", async ({
  page,
}) => {
  await signUpAndLand(page);

  // One step ticked in each course.
  await step(page, FIRST_CERTIFICATE_STEP)
    .getByRole("button", { name: "Mark done" })
    .click();
  await expectProgress(page, 1);
  await page.goto("/lessons/containers");
  await step(page, FIRST_CONTAINER_STEP)
    .getByRole("button", { name: "Mark done" })
    .click();
  await expectProgress(page, 1);

  // Start over on Docker: only Docker's run is set aside.
  await page.getByRole("button", { name: "Start over" }).click();
  await expect(pageMessage(page)).toContainText("fresh session");
  await expectProgress(page, 0);
  await expect(earlierSessions(page)).toContainText(
    `1 of ${CONTAINER_STEPS} steps done`,
  );

  await page.goto("/lessons/certificates");
  await expect(step(page, FIRST_CERTIFICATE_STEP)).toContainText("Done");
  await expectProgress(page, 1);
  await expect(earlierSessions(page)).toHaveCount(0);

  // And the reverse: tick Docker's fresh run, start over on certificates,
  // and Docker keeps its tick and gains no second set-aside run.
  await page.goto("/lessons/containers");
  await step(page, FIRST_CONTAINER_STEP)
    .getByRole("button", { name: "Mark done" })
    .click();
  await expectProgress(page, 1);

  await page.goto("/lessons/certificates");
  await page.getByRole("button", { name: "Start over" }).click();
  await expect(pageMessage(page)).toContainText("fresh session");
  await expectProgress(page, 0);
  await expect(earlierSessions(page)).toContainText(
    `1 of ${CERTIFICATE_STEPS} steps done`,
  );

  await page.goto("/lessons/containers");
  await expect(step(page, FIRST_CONTAINER_STEP)).toContainText("Done");
  await expectProgress(page, 1);
  await expect(earlierSessions(page).getByRole("listitem")).toHaveCount(1);
});
