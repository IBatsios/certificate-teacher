import { describe, expect, test } from "vitest";
import { SIGN_IN_LINK_MAX_AGE_SECONDS, signInEmail } from "@/lib/sign-in-email";

const HOST = "teacher.example.com";
const URL_WITH_QUERY =
  "https://teacher.example.com/api/auth/callback/resend?callbackUrl=https%3A%2F%2Fteacher.example.com%2Fsign-in&token=abc123&email=me%40example.com";

function email(host: string = HOST) {
  return signInEmail({ url: URL_WITH_QUERY, host });
}

describe("signInEmail", () => {
  test("names the site in the subject, so it is recognisable in a crowded inbox", () => {
    expect(email().subject).toContain(HOST);
  });

  test("carries the link in the plain-text part exactly as given", () => {
    // The browser tests read this part, and every character counts.
    expect(email().text).toContain(URL_WITH_QUERY);
  });

  test("escapes the link's ampersands in the HTML part", () => {
    // Arrange
    const html = email().html;

    // Assert
    expect(html).toContain("&amp;token=abc123");
    expect(html).not.toContain("sign-in&token");
  });

  test("says the link expires and works only once", () => {
    // Arrange
    const { text, html } = email();

    // Assert
    for (const part of [text, html]) {
      expect(part).toMatch(/once/i);
      expect(part).toMatch(/24 hours/i);
    }
  });

  test("tells a reader who did not ask for it that they can ignore it", () => {
    // Arrange
    const { text, html } = email();

    // Assert
    for (const part of [text, html]) {
      expect(part).toMatch(/did not ask/i);
    }
  });

  test("carries enough prose that it is not one bare link", () => {
    // Arrange: a link with almost no text around it reads as spam.
    const withoutUrl = email().text.split(URL_WITH_QUERY).join("");

    // Assert
    expect(withoutUrl.trim().length).toBeGreaterThan(200);
  });

  test("wraps the prose but never breaks the link across lines", () => {
    // Arrange: a long host would push a hardcoded first line over the edge.
    const lines = email(
      "teacher.a-rather-long-subdomain.example.com",
    ).text.split("\n");

    // Assert
    for (const line of lines) {
      if (line !== URL_WITH_QUERY) {
        expect(line.length).toBeLessThanOrEqual(78);
      }
    }
    expect(lines).toContain(URL_WITH_QUERY);
  });

  test("states the expiry the providers are actually configured with", () => {
    expect(SIGN_IN_LINK_MAX_AGE_SECONDS).toBe(24 * 60 * 60);
  });
});
