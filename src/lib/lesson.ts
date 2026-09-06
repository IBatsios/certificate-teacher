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

export type Lesson = Readonly<{
  slug: string;
  title: string;
  /** Markdown shown above the steps. */
  intro: string;
  steps: ReadonlyArray<LessonStep>;
}>;

// Lessons are written by the developer as markdown under content/lessons/<slug>:
// lesson.md holds the title and intro, and every NN-*.md is one step.
const CONTENT_ROOT = path.join(process.cwd(), "content", "lessons");
const STEP_FILE = /^(\d+)-.*\.md$/;
const LESSON_FILE = "lesson.md";
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

/** Reads a lesson from disk. Throws when the folder or its files are wrong. */
export async function loadLesson(slug: string): Promise<Lesson> {
  if (!SLUG.test(slug)) {
    throw new Error(`Lesson slug "${slug}" is not valid.`);
  }
  const folder = path.join(CONTENT_ROOT, slug);
  if (path.relative(CONTENT_ROOT, folder).startsWith("..")) {
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

  return { slug, title, intro: content.trim(), steps };
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
