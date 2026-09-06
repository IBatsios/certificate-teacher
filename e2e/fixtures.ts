import {
  test as base,
  expect,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";

// Every browser context gets the origin secret the app expects (D44) and its
// own client address, the header Cloudflare would set, so the per-address
// sign-in limits count each test on its own.
let contextsOpened = 0;

export const test = base.extend({
  // Named `run` rather than Playwright's usual `use`, which ESLint's React
  // hooks rule would otherwise mistake for a hook.
  context: async ({ context }, run) => {
    await context.setExtraHTTPHeaders(headersForNewContext());
    await run(context);
  },
});

export { expect };

/** A page in a fresh context that carries the same headers as the default one. */
export async function newPage(browser: Browser): Promise<Page> {
  const context: BrowserContext = await browser.newContext();
  await context.setExtraHTTPHeaders(headersForNewContext());
  return context.newPage();
}

export function originSecretHeader(): Record<string, string> {
  const secret = process.env.E2E_ORIGIN_SECRET;
  return secret === undefined ? {} : { "x-origin-secret": secret };
}

function headersForNewContext(): Record<string, string> {
  contextsOpened += 1;
  const n = contextsOpened;
  const address = `10.${(n >> 16) & 255}.${(n >> 8) & 255}.${n & 255}`;
  return { ...originSecretHeader(), "cf-connecting-ip": address };
}
