import type { Page } from "@playwright/test";
import { expect, newPage, test } from "./fixtures";
import {
  pageMessage,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  uniqueEmail,
} from "./helpers";

const BUILD_STEPS = 6;
const FIRST_BUILD_STEP = /A Dockerfile is a recipe/;
const SIGNING_STEP = /Sign your work/;
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

/**
 * The token the signing step shows this student. It appears more than once,
 * in the sentence that names it and in the Dockerfile that carries it, and
 * every appearance must be the same token.
 */
async function tokenShown(page: Page): Promise<string> {
  const text = await step(page, SIGNING_STEP).innerText();
  const tokens = Array.from(text.matchAll(TOKEN), (match) => match[0]);
  expect(tokens.length).toBeGreaterThanOrEqual(2);
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

async function signUpAndOpenLesson(page: Page): Promise<string> {
  const email = uniqueEmail("build");
  await signUpWithPassword(page, email);
  await expect(page).toHaveURL(/\/lessons\/certificates$/);
  await page.goto("/lessons/build-an-image");
  return email;
}

test("a student works through lesson 2, and the token it shows stays the same until they start over", async ({
  page,
}) => {
  const email = await signUpAndOpenLesson(page);

  await expect(page.getByText("Lesson 2", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Build your own image",
  );
  await expectProgress(page, 0);

  // The Dockerfile is given as a whole file to copy, labelled as one.
  await expect(step(page, FIRST_BUILD_STEP)).toContainText("The whole file");

  // The token is shown in the signing step, stable across a reload, and
  // stable across signing out and back in: it belongs to the session, not
  // to the page load.
  const token = await tokenShown(page);
  await page.reload();
  expect(await tokenShown(page)).toBe(token);

  await step(page, FIRST_BUILD_STEP)
    .getByRole("button", { name: "Mark done" })
    .click();
  await expect(step(page, FIRST_BUILD_STEP)).toContainText("Done");
  await page.reload();
  await expectProgress(page, 1);

  await signOut(page);
  await signInWithPassword(page, email);
  await expect(page).toHaveURL(/\/lessons\/certificates$/);
  await page.goto("/lessons/build-an-image");
  await expectProgress(page, 1);
  expect(await tokenShown(page)).toBe(token);

  // The note leads to lesson 3, which exists since Task 14; the run journey
  // follows it. This one goes on to start over instead.
  await tickRemainingSteps(page, 1, BUILD_STEPS);
  await expect(finished(page)).toContainText(
    "Every step of this lesson is done",
  );
  await expect(finished(page)).toContainText("Lesson 3");
  await expect(finished(page).getByRole("link")).toHaveAttribute(
    "href",
    "/lessons/run-it-properly",
  );

  // Starting over begins a new session, so the token changes with it, and
  // the lesson said it would.
  await page.getByRole("button", { name: "Start over" }).click();
  await expect(pageMessage(page)).toContainText("fresh session");
  await expectProgress(page, 0);
  expect(await tokenShown(page)).not.toBe(token);
});

test("two students are shown different tokens", async ({ page, browser }) => {
  await signUpAndOpenLesson(page);
  const token = await tokenShown(page);

  const other = await newPage(browser);
  await signUpAndOpenLesson(other);
  expect(await tokenShown(other)).not.toBe(token);
  await other.context().close();
});

test("the home page counts all three Docker lessons", async ({ page }) => {
  await page.goto("/");
  const docker = page
    .getByRole("region", { name: "Courses" })
    .getByRole("article")
    .filter({ hasText: "Docker" });
  await expect(docker).toContainText("3 lessons and a test");
});
