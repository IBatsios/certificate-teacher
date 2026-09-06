import { expect, type Locator, type Page } from "@playwright/test";

export const PASSWORD = "correct horse battery staple";

// Mailpit's web port. docker-compose.override.yml publishes it on 8026 locally;
// CI's service publishes the image's default, 8025.
const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://localhost:8026";
const MAIL_DEADLINE_MS = 15_000;
const MAIL_POLL_MS = 250;

/** An address no run has used before. global-teardown.ts removes them all. */
export function uniqueEmail(prefix: string): string {
  const stamp = Date.now().toString(36);
  const salt = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${stamp}-${salt}@e2e.test`;
}

/**
 * The message a page shows after an action. Scoped to <main> because Next.js
 * adds its own empty `role="alert"` live region for route announcements.
 */
export function pageMessage(page: Page): Locator {
  return page.getByRole("main").getByRole("alert");
}

/** The account strip at the top of every page. */
export function accountNav(page: Page): Locator {
  return page.getByRole("navigation", { name: "Account" });
}

export async function signUpWithPassword(
  page: Page,
  email: string,
): Promise<void> {
  await page.goto("/sign-up");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel(/^Password/).fill(PASSWORD);
  await page.getByRole("button", { name: "Create my account" }).click();
}

export async function signInWithPassword(
  page: Page,
  email: string,
  password: string = PASSWORD,
): Promise<void> {
  await page.goto("/sign-in");
  const form = page.getByRole("form", { name: "With your password" });
  await form.getByLabel("Email").fill(email);
  await form.getByLabel("Password").fill(password);
  await form.getByRole("button", { name: "Sign in" }).click();
}

/**
 * Signs in as `email` through a magic link, which creates the account on
 * first use. The admin's account can only be created this way (D30), and
 * several tests share it.
 */
export async function signInWithLink(page: Page, email: string): Promise<void> {
  await requestSignInLink(page, email);
  const link = await waitForSignInLink(email);
  await page.goto(link);
}

export async function requestSignInLink(
  page: Page,
  email: string,
): Promise<void> {
  await page.goto("/sign-in");
  const form = page.getByRole("form", {
    name: "Or with a link sent to your email",
  });
  await form.getByLabel("Email").fill(email);
  await form.getByRole("button", { name: "Email me a sign-in link" }).click();
}

export async function signOut(page: Page): Promise<void> {
  await accountNav(page).getByRole("button", { name: "Sign out" }).click();
  await expect(
    accountNav(page).getByRole("link", { name: "Sign in" }),
  ).toBeVisible();
}

/**
 * The sign-in link from the newest email Mailpit holds for `email`. Polls with
 * a deadline rather than sleeping a fixed time: the email usually lands well
 * under a second after the form is submitted.
 */
export async function waitForSignInLink(email: string): Promise<string> {
  const deadline = Date.now() + MAIL_DEADLINE_MS;
  while (Date.now() < deadline) {
    const link = await findSignInLink(email);
    if (link !== null) {
      return link;
    }
    await new Promise((resolve) => setTimeout(resolve, MAIL_POLL_MS));
  }
  throw new Error(
    `No sign-in email for ${email} reached Mailpit at ${MAILPIT_URL} within ${MAIL_DEADLINE_MS} ms. Is it running (docker compose ps)?`,
  );
}

type MailpitSearch = Readonly<{ messages: ReadonlyArray<{ ID: string }> }>;
type MailpitMessage = Readonly<{ Text: string }>;

async function findSignInLink(email: string): Promise<string | null> {
  const query = encodeURIComponent(`to:${email}`);
  const search = await fetchJson<MailpitSearch>(
    `${MAILPIT_URL}/api/v1/search?query=${query}`,
  );
  const newest = search.messages[0];
  if (newest === undefined) {
    return null;
  }
  const message = await fetchJson<MailpitMessage>(
    `${MAILPIT_URL}/api/v1/message/${newest.ID}`,
  );
  await deleteMessage(newest.ID);
  const match = message.Text.match(
    /https?:\/\/\S+\/api\/auth\/callback\/nodemailer\S*/,
  );
  return match === null ? null : match[0].replace(/&amp;/g, "&");
}

/** Removes a read email so a later request for the same address finds only its own. */
async function deleteMessage(id: string): Promise<void> {
  const response = await fetch(`${MAILPIT_URL}/api/v1/messages`, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ IDs: [id] }),
  });
  if (!response.ok) {
    throw new Error(
      `Mailpit answered ${response.status} deleting message ${id}`,
    );
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Mailpit answered ${response.status} for ${url}`);
  }
  return (await response.json()) as T;
}
