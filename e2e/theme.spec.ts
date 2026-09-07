import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const THEME_ATTRIBUTE = "data-theme";

function toggle(page: Page) {
  return page.getByRole("group", { name: "Colour theme" });
}

test.describe("the colour theme toggle", () => {
  test("starts on system, where no attribute is set and the browser decides", async ({
    page,
  }) => {
    await page.goto("/sign-in");

    await expect(
      toggle(page).getByRole("radio", { name: "System" }),
    ).toBeChecked();
    await expect(page.locator("html")).not.toHaveAttribute(
      THEME_ATTRIBUTE,
      /.*/,
    );
  });

  test("a reader can force dark, and it survives a reload", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/sign-in");

    // Act
    await toggle(page).getByText("Dark", { exact: true }).click();

    // Assert
    await expect(page.locator("html")).toHaveAttribute(THEME_ATTRIBUTE, "dark");

    // Act: the choice is remembered, and applied before the page paints.
    await page.reload();

    // Assert
    await expect(page.locator("html")).toHaveAttribute(THEME_ATTRIBUTE, "dark");
    await expect(
      toggle(page).getByRole("radio", { name: "Dark" }),
    ).toBeChecked();
  });

  test("going back to system takes the attribute off again", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/sign-in");
    await toggle(page).getByText("Dark", { exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute(THEME_ATTRIBUTE, "dark");

    // Act
    await toggle(page).getByText("System", { exact: true }).click();

    // Assert
    await expect(page.locator("html")).not.toHaveAttribute(
      THEME_ATTRIBUTE,
      /.*/,
    );
  });
});

test.describe("when the reader's system asks for dark", () => {
  test.use({ colorScheme: "dark" });

  test("the page is readable without touching anything", async ({ page }) => {
    // Arrange
    await page.goto("/sign-in");

    // Act: read what the browser computes, not what the stylesheet hoped for.
    const contrast = await readBodyContrast(page);

    // Assert: the bug was dark text on a dark page, which is near zero here.
    expect(contrast).toBeGreaterThan(0.5);
  });

  test("a reader can still force light", async ({ page }) => {
    // Arrange
    await page.goto("/sign-in");

    // Act
    await toggle(page).getByText("Light", { exact: true }).click();

    // Assert
    await expect(page.locator("html")).toHaveAttribute(
      THEME_ATTRIBUTE,
      "light",
    );
    expect(await readBodyContrast(page)).toBeGreaterThan(0.5);
  });
});

/** How far apart the body's text and background are, from 0 to 1. */
async function readBodyContrast(page: Page): Promise<number> {
  return page.evaluate(() => {
    const style = getComputedStyle(document.body);
    const brightness = (colour: string): number => {
      const parts = colour.match(/\d+(\.\d+)?/g);
      if (parts === null) {
        return 0;
      }
      const [r, g, b] = parts.map(Number);
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    };
    return Math.abs(
      brightness(style.backgroundColor) - brightness(style.color),
    );
  });
}
