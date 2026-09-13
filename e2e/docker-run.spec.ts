import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { signUpWithPassword, uniqueEmail } from "./helpers";

const RUN_STEPS = 6;
const BUILD_STEPS = 6;
const CONTAINER_STEPS = 5;

const FIRST_CERTIFICATE_STEP = /What a certificate chain is/;
const OPENSSL_STEP = /Check that OpenSSL is on your computer/;
const SIGNING_STEP = /Sign your work/;
const PRODUCTION_STEP = /Not as root/;
const HTTPS_STEP = /Put your certificate in front of it/;
// The shape of a challenge token, as `src/lib/challenge-token.ts` makes it.
const TOKEN = /\b[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}\b/g;

function step(page: Page, title: RegExp) {
  return page.getByRole("region", { name: title });
}

function finished(page: Page) {
  return page.getByRole("region", { name: /done|whole course/i });
}

async function expectProgress(page: Page, done: number): Promise<void> {
  await expect(
    page.getByRole("progressbar", { name: "Lesson progress" }),
  ).toHaveAttribute("aria-valuenow", String(done));
}

/** The one token a step shows, however many times it shows it. */
async function tokenIn(page: Page, title: RegExp): Promise<string> {
  const text = await step(page, title).innerText();
  const tokens = Array.from(text.matchAll(TOKEN), (match) => match[0]);
  expect(tokens.length).toBeGreaterThanOrEqual(1);
  expect(new Set(tokens).size).toBe(1);
  return tokens[0];
}

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

test("a student finishes the Docker course on lesson 3, with lesson 2's token, and the certificates course is left as it was", async ({
  page,
}) => {
  await signUpWithPassword(page, uniqueEmail("run"));
  await expect(page).toHaveURL(/\/lessons\/certificates$/);

  // One certificates step ticked first, so that finishing the Docker course
  // can be shown to leave that course exactly as it was.
  await step(page, FIRST_CERTIFICATE_STEP)
    .getByRole("button", { name: "Mark done" })
    .click();
  await expectProgress(page, 1);

  // Lesson 2's note leads to lesson 3, and the token lesson 2 showed is the
  // one lesson 3's recipe carries: the two lessons share the course's run.
  await page.goto("/lessons/build-an-image");
  const token = await tokenIn(page, SIGNING_STEP);
  await tickRemainingSteps(page, 0, BUILD_STEPS);
  await finished(page).getByRole("link").click();
  await expect(page).toHaveURL(/\/lessons\/run-it-properly$/);
  await expect(page.getByText("Lesson 3", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Run it like a real thing",
  );
  await expectProgress(page, 0);
  expect(await tokenIn(page, PRODUCTION_STEP)).toBe(token);

  // The last step says what to do without my-certs, names the port clash
  // before the student can meet it, and the way back lands on the step
  // that starts making the certificate again.
  const https = step(page, HTTPS_STEP);
  await expect(https).toContainText("If that folder is gone");
  await expect(https).toContainText("port is already allocated");
  await https
    .getByRole("link", { name: "steps 2 to 4 of the certificates lesson" })
    .click();
  await expect(page).toHaveURL(/\/lessons\/certificates#step-openssl$/);
  await expect(step(page, OPENSSL_STEP)).toBeInViewport();

  // Finishing lesson 3 finishes the lesson, not the course: lesson 1 is
  // untouched, and the note says so, with the way there.
  await page.goto("/lessons/run-it-properly");
  await tickRemainingSteps(page, 0, RUN_STEPS);
  await expect(finished(page)).toContainText(
    "Every step of this lesson is done",
  );
  await expect(
    finished(page).getByRole("link", { name: "lesson 1" }),
  ).toHaveAttribute("href", "/lessons/containers");
  await expect(
    finished(page).getByRole("link", { name: "lesson 2" }),
  ).toHaveAttribute("href", "/lessons/build-an-image");
  await finished(page).getByRole("link", { name: "lesson 1" }).click();
  await expect(page).toHaveURL(/\/lessons\/containers$/);
  await tickRemainingSteps(page, 0, CONTAINER_STEPS);

  // Every step of every Docker lesson is done, so the last lesson shows the
  // course note. It names the check and the test without linking to
  // either, since neither is written yet.
  await page.goto("/lessons/run-it-properly");
  await expect(finished(page)).toContainText("That is the whole course");
  await expect(finished(page)).toContainText("check");
  await expect(finished(page)).toContainText("test");
  await expect(finished(page).getByRole("link")).toHaveCount(0);

  // The certificates course is where it was left: one step done, no run
  // set aside, and nothing saying it is finished.
  await page.goto("/lessons/certificates");
  await expectProgress(page, 1);
  await expect(step(page, FIRST_CERTIFICATE_STEP)).toContainText("Done");
  await expect(finished(page)).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Earlier sessions" }),
  ).toHaveCount(0);
});
