import { expect, test, type Page } from "@playwright/test";
import {
  pageMessage,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  uniqueEmail,
} from "./helpers";

const FIRST_STEP = /What a certificate chain is/;

function step(page: Page, title: RegExp) {
  return page.getByRole("region", { name: title });
}

test("a student ticks a step, comes back to find it ticked, and can start over without losing it", async ({
  page,
}) => {
  const email = uniqueEmail("student");
  await signUpWithPassword(page, email);
  await expect(page).toHaveURL(/\/lessons\/certificates$/);
  await expect(page.getByText("0 of 5 steps done")).toBeVisible();

  await step(page, FIRST_STEP)
    .getByRole("button", { name: "Mark done" })
    .click();
  await expect(step(page, FIRST_STEP)).toContainText("Done");
  await expect(page.getByText("1 of 5 steps done")).toBeVisible();

  await signOut(page);
  await signInWithPassword(page, email);
  await expect(page).toHaveURL(/\/lessons\/certificates$/);
  await expect(step(page, FIRST_STEP)).toContainText("Done");

  await page.getByRole("button", { name: "Start over" }).click();
  await expect(pageMessage(page)).toContainText("fresh session");
  await expect(page.getByText("0 of 5 steps done")).toBeVisible();
  await expect(
    step(page, FIRST_STEP).getByRole("button", { name: "Mark done" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Earlier sessions" }),
  ).toContainText("1 of 5 steps done");
});

test("a ticked step can be undone", async ({ page }) => {
  await signUpWithPassword(page, uniqueEmail("student"));
  await step(page, FIRST_STEP)
    .getByRole("button", { name: "Mark done" })
    .click();
  await expect(step(page, FIRST_STEP)).toContainText("Done");

  await step(page, FIRST_STEP).getByRole("button", { name: "Undo" }).click();

  await expect(
    step(page, FIRST_STEP).getByRole("button", { name: "Mark done" }),
  ).toBeVisible();
  await expect(page.getByText("0 of 5 steps done")).toBeVisible();
});
