import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type LessonStep = Readonly<{
  /** Position in the lesson, from the number the file name starts with. */
  order: number;
  /** Stable identifier stored with a student's progress. Never renumber. */
  key: string;
  title: string;
  /** Markdown. */
  body: string;
}>;

/** What a student reads in the panel that appears once every step is done. */
export type FinishedNote = Readonly<{
  title: string;
  /** Markdown. Links to the next lesson, the check, or the test live here. */
  body: string;
}>;

export type Lesson = Readonly<{
  slug: string;
  title: string;
  /** Markdown shown above the steps. */
  intro: string;
  steps: ReadonlyArray<LessonStep>;
  /**
   * What the student reads once every step of this lesson is ticked, from
   * `finished.md`. Null when the lesson has none; the page then shows its
   * plain "every step is done" line.
   */
  finished: FinishedNote | null;
  /**
   * What the student reads once every step of the whole course is ticked,
   * from `course-finished.md`. Only the last lesson of a course has a use for
   * it. Null everywhere else, and the page shows `finished` instead.
   */
  courseFinished: FinishedNote | null;
}>;

// Lessons are written by the developer as markdown under content/lessons/<slug>:
// lesson.md holds the title and intro, every NN-*.md is one step, and the
// optional finished.md and course-finished.md are the notes a student reads
// when they are done. Nothing about a lesson lives in code.
const CONTENT_ROOT = path.join(process.cwd(), "content", "lessons");
const STEP_FILE = /^(\d+)-.*\.md$/;
const LESSON_FILE = "lesson.md";
const FINISHED_FILE = "finished.md";
const COURSE_FINISHED_FILE = "course-finished.md";
// A slug is a folder name and nothing else: no separators, no dots.
const SLUG = /^[a-z0-9-]+$/;

/** Turns one step file into a step. Pure; exported for its tests. */
export function parseStep(fileName: string, text: string): LessonStep {
  const match = STEP_FILE.exec(fileName);
  if (match === null) {
    throw new Error(
      `Lesson step file "${fileName}" must start with a number, like 01-what-a-chain-is.md.`,
    );
  }
  const { data, content } = matter(text);
  const key = asText(data.key);
  const title = asText(data.title);
  if (key === null) {
    throw new Error(
      `Lesson step file "${fileName}" needs a "key" in its header.`,
    );
  }
  if (title === null) {
    throw new Error(
      `Lesson step file "${fileName}" needs a "title" in its header.`,
    );
  }
  return { order: Number(match[1]), key, title, body: content.trim() };
}

/** Turns a finished note file into a note. Pure; exported for its tests. */
export function parseNote(fileName: string, text: string): FinishedNote {
  const { data, content } = matter(text);
  const title = asText(data.title);
  if (title === null) {
    throw new Error(`Lesson note "${fileName}" needs a "title" in its header.`);
  }
  return { title, body: content.trim() };
}

/**
 * Reads a lesson from disk. Throws when the folder or its files are wrong.
 * `root` is where the lesson folders live; the tests point it at fixtures.
 */
export async function loadLesson(
  slug: string,
  root: string = CONTENT_ROOT,
): Promise<Lesson> {
  if (!SLUG.test(slug)) {
    throw new Error(`Lesson slug "${slug}" is not valid.`);
  }
  const folder = path.join(root, slug);
  if (path.relative(root, folder).startsWith("..")) {
    throw new Error(`Lesson slug "${slug}" is not valid.`);
  }
  const fileNames = await listFiles(folder, slug);

  const lessonText = await fs.readFile(path.join(folder, LESSON_FILE), "utf8");
  const { data, content } = matter(lessonText);
  const title = asText(data.title);
  if (title === null) {
    throw new Error(`Lesson "${slug}" needs a "title" in ${LESSON_FILE}.`);
  }

  const stepFiles = fileNames.filter((name) => STEP_FILE.test(name)).sort();
  const steps = await Promise.all(
    stepFiles.map(async (name) =>
      parseStep(name, await fs.readFile(path.join(folder, name), "utf8")),
    ),
  );
  assertDistinctKeys(slug, steps);

  const [finished, courseFinished] = await Promise.all([
    readNote(folder, fileNames, FINISHED_FILE),
    readNote(folder, fileNames, COURSE_FINISHED_FILE),
  ]);

  return {
    slug,
    title,
    intro: content.trim(),
    steps,
    finished,
    courseFinished,
  };
}

/**
 * Every lesson of a course, in the order the catalog lists them. A course that
 * names no lesson yet loads none, which is not an error: the catalog lists a
 * coming course before its content exists.
 */
export function loadCourseLessons(
  course: Readonly<{ lessonSlugs: ReadonlyArray<string> }>,
): Promise<ReadonlyArray<Lesson>> {
  return Promise.all(course.lessonSlugs.map((slug) => loadLesson(slug)));
}

/** One of the optional notes, or null when the lesson has no such file. */
async function readNote(
  folder: string,
  fileNames: ReadonlyArray<string>,
  fileName: string,
): Promise<FinishedNote | null> {
  if (!fileNames.includes(fileName)) {
    return null;
  }
  return parseNote(
    fileName,
    await fs.readFile(path.join(folder, fileName), "utf8"),
  );
}

async function listFiles(folder: string, slug: string): Promise<string[]> {
  try {
    return await fs.readdir(folder);
  } catch (error) {
    throw new Error(`Lesson "${slug}" has no folder at ${folder}.`, {
      cause: error,
    });
  }
}

function assertDistinctKeys(slug: string, steps: ReadonlyArray<LessonStep>) {
  const seen = new Set<string>();
  for (const step of steps) {
    if (seen.has(step.key)) {
      throw new Error(
        `Lesson "${slug}" uses the step key "${step.key}" twice.`,
      );
    }
    seen.add(step.key);
  }
}

function asText(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}
