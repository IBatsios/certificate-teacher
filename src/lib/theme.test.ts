import { describe, expect, test } from "vitest";
import {
  STORAGE_KEY,
  THEME_CHOICES,
  isThemeChoice,
  readThemeChoice,
  themeAttribute,
  THEME_ATTRIBUTE,
  themeScript,
} from "@/lib/theme";

describe("isThemeChoice", () => {
  test("accepts the three the toggle offers", () => {
    for (const choice of THEME_CHOICES) {
      expect(isThemeChoice(choice)).toBe(true);
    }
  });

  test("rejects anything else, including a stale stored value", () => {
    for (const value of ["", "auto", "DARK", null, undefined, 3]) {
      expect(isThemeChoice(value)).toBe(false);
    }
  });
});

describe("readThemeChoice", () => {
  test("falls back to system when nothing is stored", () => {
    expect(readThemeChoice(null)).toBe("system");
  });

  test("falls back to system when the stored value is not one of ours", () => {
    expect(readThemeChoice("midnight")).toBe("system");
  });

  test("returns a stored choice unchanged", () => {
    expect(readThemeChoice("dark")).toBe("dark");
    expect(readThemeChoice("light")).toBe("light");
  });
});

describe("themeAttribute", () => {
  test("names the scheme for an explicit choice", () => {
    expect(themeAttribute("dark")).toBe("dark");
    expect(themeAttribute("light")).toBe("light");
  });

  test("is null for system, so the attribute comes off and the media query decides", () => {
    expect(themeAttribute("system")).toBeNull();
  });
});

describe("STORAGE_KEY", () => {
  test("is namespaced, because the browser tests share an origin with other work", () => {
    expect(STORAGE_KEY).toContain("teacher");
  });
});

describe("themeScript", () => {
  test("reads the same key the toggle writes", () => {
    expect(themeScript()).toContain(JSON.stringify(STORAGE_KEY));
  });

  test("sets the same attribute the stylesheet keys off", () => {
    expect(themeScript()).toContain(JSON.stringify(THEME_ATTRIBUTE));
  });

  test("survives a browser that refuses local storage", () => {
    // Arrange: private windows throw on read rather than returning null.
    const script = themeScript();

    // Assert
    expect(script).toContain("try{");
    expect(script).toContain("catch(e){}");
  });

  test("sets nothing for system, leaving the media query in charge", () => {
    // Arrange
    const script = themeScript();

    // Assert: only the two explicit choices are written.
    expect(script).toContain('c==="light"||c==="dark"');
    expect(script).not.toContain('"system"');
  });

  test("runs as one self-contained statement with no stray newlines", () => {
    expect(themeScript().split("\n")).toHaveLength(1);
  });
});
