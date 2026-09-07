import { readFileSync } from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { signOut, signUpWithPassword, uniqueEmail } from "./helpers";

type Choice = { id: string; label: string };
type Question = {
  id: string;
  topic: string;
  choices: Choice[];
  correctChoiceId: string;
};
type Bank = { topics: { id: string; title: string }[]; questions: Question[] };

const bank: Bank = JSON.parse(
  readFileSync(
    path.join(process.cwd(), "content", "test", "questions.json"),
    "utf8",
  ),
);

/** A choice that is not the right one, for deliberately failing a topic. */
function wrongChoiceFor(question: Question): string {
  const wrong = question.choices.find(
    (choice) => choice.id !== question.correctChoiceId,
  );
  if (wrong === undefined) {
    throw new Error(`Question ${question.id} offers no wrong answer.`);
  }
  return wrong.id;
}

/** Answers every question, getting the named topics deliberately wrong. */
async function answerAll(
  page: Page,
  topicsToFail: ReadonlyArray<string>,
): Promise<void> {
  for (const question of bank.questions) {
    const choiceId = topicsToFail.includes(question.topic)
      ? wrongChoiceFor(question)
      : question.correctChoiceId;
    await page
      .locator(`input[name="${question.id}"][value="${choiceId}"]`)
      .check();
  }
  await page.getByRole("button", { name: "Check my answers" }).click();
}

function result(page: Page) {
  return page.getByRole("region", { name: /You passed|Not yet/ });
}

async function signUpAndOpenTest(page: Page): Promise<void> {
  await signUpWithPassword(page, uniqueEmail("student"));
  await expect(page).toHaveURL(/\/lessons\/certificates$/);
  await page.goto("/test");
}

test("every question right is a pass, with nothing to go back to", async ({
  page,
}) => {
  await signUpAndOpenTest(page);

  await answerAll(page, []);

  await expect(result(page)).toContainText("You passed");
  await expect(result(page)).toContainText(
    `${bank.questions.length} of ${bank.questions.length} correct`,
  );
});

/**
 * The rule this course exists for: knowing three parts and not the fourth is
 * a fail, and the page says which part.
 */
test("missing one topic fails and names that topic as the focus area", async ({
  page,
}) => {
  await signUpAndOpenTest(page);

  await answerAll(page, ["java"]);

  await expect(result(page)).toContainText("Not yet");
  await expect(result(page)).toContainText("The Java keystore");
  // The topics they did know are not listed as things to go back to.
  await expect(result(page)).not.toContainText("Certificate chains");
});

test("missing two topics names both", async ({ page }) => {
  await signUpAndOpenTest(page);

  await answerAll(page, ["proxy", "java"]);

  await expect(result(page)).toContainText("Not yet");
  await expect(result(page)).toContainText("The reverse proxy");
  await expect(result(page)).toContainText("The Java keystore");
});

test("a result can be reopened by its link and belongs to the student", async ({
  page,
}) => {
  await signUpAndOpenTest(page);
  await answerAll(page, []);
  await expect(result(page)).toContainText("You passed");
  const url = page.url();

  await page.goto("/test");
  await page.goto(url);

  await expect(result(page)).toContainText("You passed");
});

test("another student's attempt is not shown", async ({ page }) => {
  // Arrange: one student takes the test and keeps the link.
  await signUpAndOpenTest(page);
  await answerAll(page, []);
  await expect(result(page)).toContainText("You passed");
  const otherResult = page.url();

  // Act: a different student opens it. Signing up while signed in would be
  // sent home instead, so this signs out first.
  await signOut(page);
  await signUpWithPassword(page, uniqueEmail("student"));
  await expect(page).toHaveURL(/\/lessons\/certificates$/);
  await page.goto(otherResult);

  // Assert: they get the test, not someone else's verdict.
  await expect(page.getByRole("main")).toContainText("could not find");
  await expect(result(page)).toHaveCount(0);
});

test("the test is open before the lessons are finished, and says so", async ({
  page,
}) => {
  await signUpAndOpenTest(page);

  await expect(page.getByRole("main")).toContainText("have not finished");
  await expect(
    page.getByRole("button", { name: "Check my answers" }),
  ).toBeVisible();
});

/**
 * Guards the thing that made the first version of this test meaningless: the
 * correct answer was first in all sixteen questions, so clicking down the
 * first column scored full marks without reading anything.
 */
test("the choices are in a different order each time the test is opened", async ({
  page,
}) => {
  await signUpAndOpenTest(page);
  const first = await choiceOrder(page);

  await page.reload();
  const second = await choiceOrder(page);

  expect(first).toHaveLength(bank.questions.length);
  expect(second).not.toEqual(first);
});

/** The choice ids of every question, in the order the page shows them. */
async function choiceOrder(page: Page): Promise<string[]> {
  return Promise.all(
    bank.questions.map(async (question) =>
      (
        await page
          .locator(`input[name="${question.id}"]`)
          .evaluateAll((nodes) =>
            nodes.map((node) => (node as HTMLInputElement).value).join(","),
          )
      ).toString(),
    ),
  );
}
