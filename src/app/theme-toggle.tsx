"use client";

import { useSyncExternalStore } from "react";
import {
  STORAGE_KEY,
  THEME_ATTRIBUTE,
  THEME_CHOICES,
  THEME_LABELS,
  readThemeChoice,
  themeAttribute,
  type ThemeChoice,
} from "@/lib/theme";

// Fired on this tab after a choice is stored. The browser's own `storage`
// event only reaches other tabs, so without this the control would not
// re-render for the person who just clicked it.
const CHANGED = "teacher:theme-change";

/**
 * Chooses the colour scheme. Real radio inputs rather than buttons, so the
 * arrow keys work and a screen reader says "2 of 3" without any code from us;
 * the visible part is the label, and the input itself is off screen.
 *
 * Without JavaScript this renders and does nothing, and the reader keeps the
 * scheme their system asked for. That is the same answer the toggle gives by
 * default, so nothing is lost (D68).
 */
export function ThemeToggle() {
  // Local storage is external mutable state, so it is read through the hook
  // built for that rather than copied into state inside an effect. Choosing
  // in one tab now also updates the control in the others.
  const stored = useSyncExternalStore(subscribe, readStored, readOnServer);
  const choice = readThemeChoice(stored);

  function pick(next: ThemeChoice): void {
    apply(next);
    store(next);
    window.dispatchEvent(new Event(CHANGED));
  }

  return (
    <fieldset className="flex items-center gap-0.5 rounded-full border border-line-soft p-0.5">
      <legend className="sr-only">Colour theme</legend>
      {THEME_CHOICES.map((value) => (
        <div key={value} className="contents">
          <input
            type="radio"
            id={`theme-${value}`}
            name="theme"
            value={value}
            checked={choice === value}
            onChange={() => pick(value)}
            className="peer sr-only"
          />
          <label
            htmlFor={`theme-${value}`}
            className="cursor-pointer rounded-full px-2.5 py-1 text-xs text-muted transition-colors hover:text-strong peer-checked:bg-accent peer-checked:text-on-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
          >
            {THEME_LABELS[value]}
          </label>
        </div>
      ))}
    </fieldset>
  );
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGED, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGED, onChange);
  };
}

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // A private window can refuse storage outright. System is a fine answer.
    return null;
  }
}

/** The server has no storage, so it always renders the system choice. */
function readOnServer(): string | null {
  return null;
}

function store(choice: ThemeChoice): void {
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // The choice still applies to this page; it just will not be remembered.
  }
}

function apply(choice: ThemeChoice): void {
  const attribute = themeAttribute(choice);
  if (attribute === null) {
    document.documentElement.removeAttribute(THEME_ATTRIBUTE);
    return;
  }
  document.documentElement.setAttribute(THEME_ATTRIBUTE, attribute);
}
