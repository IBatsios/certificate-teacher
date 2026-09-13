import type { FinishedNote, Lesson } from "@/lib/lesson";

// A lesson is markdown written ahead of time, and one thing in it is not:
// the challenge token, which differs per student and per session. A step
// writes `{{challenge-token}}` where the token goes, and the page fills it
// in before rendering, so the token lands inside a code block with a copy
// button like any other command. Only names in `values` are filled; an
// unknown one is a mistake in the content and fails loudly rather than
// showing a student a pair of braces. Pure.

const PLACEHOLDER = /\{\{([a-z][a-z0-9-]*)\}\}/g;

/** The distinct placeholder names in a text, in order of first appearance. */
export function placeholdersIn(text: string): ReadonlyArray<string> {
  const names = Array.from(text.matchAll(PLACEHOLDER), (match) => match[1]);
  return Array.from(new Set(names));
}

/** The text with every placeholder replaced by its value. */
export function fillPlaceholders(
  text: string,
  values: Readonly<Record<string, string>>,
): string {
  return text.replace(PLACEHOLDER, (_, name: string) => {
    const value = values[name];
    if (value === undefined) {
      throw new Error(
        `The placeholder "{{${name}}}" has no value; the page provides ${Object.keys(values).join(", ") || "none"}.`,
      );
    }
    return value;
  });
}

/**
 * A copy of the lesson with every placeholder filled, in every text it
 * holds: the titles as well as the bodies, so that a stray placeholder
 * anywhere in the content fails rather than shows.
 */
export function fillLessonPlaceholders(
  lesson: Lesson,
  values: Readonly<Record<string, string>>,
): Lesson {
  return {
    ...lesson,
    title: fillPlaceholders(lesson.title, values),
    intro: fillPlaceholders(lesson.intro, values),
    steps: lesson.steps.map((step) => ({
      ...step,
      title: fillPlaceholders(step.title, values),
      body: fillPlaceholders(step.body, values),
    })),
    finished: fillNote(lesson.finished, values),
    courseFinished: fillNote(lesson.courseFinished, values),
  };
}

function fillNote(
  note: FinishedNote | null,
  values: Readonly<Record<string, string>>,
): FinishedNote | null {
  return note === null
    ? null
    : {
        title: fillPlaceholders(note.title, values),
        body: fillPlaceholders(note.body, values),
      };
}
