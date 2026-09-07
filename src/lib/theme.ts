/**
 * Which colour scheme the reader has asked for. "system" means no choice:
 * the attribute comes off the root element and the `prefers-color-scheme`
 * media query in globals.css decides (D68).
 */
export const THEME_CHOICES = ["system", "light", "dark"] as const;

export type ThemeChoice = (typeof THEME_CHOICES)[number];

/** Where the choice is kept. Namespaced so it cannot collide on an origin. */
export const STORAGE_KEY = "teacher:theme";

/** The attribute the root element carries, set by the toggle and the script. */
export const THEME_ATTRIBUTE = "data-theme";

const CHOICES: ReadonlySet<unknown> = new Set(THEME_CHOICES);

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return CHOICES.has(value);
}

/** The choice a stored value stands for. Anything unrecognised means system. */
export function readThemeChoice(stored: string | null): ThemeChoice {
  return isThemeChoice(stored) ? stored : "system";
}

/**
 * What `data-theme` should be, or null to remove it. Removing rather than
 * writing "system" keeps the CSS to one rule per explicit choice.
 */
export function themeAttribute(choice: ThemeChoice): "light" | "dark" | null {
  return choice === "system" ? null : choice;
}

/** How each choice is labelled in the toggle. */
export const THEME_LABELS: Readonly<Record<ThemeChoice, string>> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

/**
 * The script that runs before the page paints, so a reader who chose dark
 * never sees a white flash first. It is deliberately tiny and dependency
 * free: it goes inline in the document, carrying the request's nonce because
 * the content security policy allows no other inline script (D45).
 *
 * Built from the constants above rather than written out, so the key and the
 * attribute cannot drift from what the toggle uses.
 */
export function themeScript(): string {
  return [
    "(function(){try{",
    `var c=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});`,
    'if(c==="light"||c==="dark"){',
    `document.documentElement.setAttribute(${JSON.stringify(THEME_ATTRIBUTE)},c);`,
    "}}catch(e){}})();",
  ].join("");
}
