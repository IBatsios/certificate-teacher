import { lessonPath } from "@/lib/lesson-routes";

/**
 * Whether a course can be worked through yet. A course that is announced but
 * not written is listed so a student can see what is coming; it links nowhere.
 */
export type CourseStatus = "available" | "coming-soon";

export type Course = Readonly<{
  /**
   * Stable identifier, stored with every learning session and test attempt
   * a student makes in the course. Not a URL: a course is reached through
   * its lessons. Never rename one.
   */
  id: string;
  title: string;
  /** What a student reads on the home page, in plain words. */
  summary: string;
  status: CourseStatus;
  /**
   * The lessons it is made of, in order. Empty until the course is written.
   * This is the only place that says which lessons make a course: progress
   * is counted over it, the test page names what is unfinished from it, and
   * the admin report totals it.
   */
  lessonSlugs: ReadonlyArray<string>;
}>;

/**
 * The course the two existing lessons make. Exported on its own because the
 * lesson pages, the verify page, the test, and the admin report are written
 * against it until Task 11 and Task 16 teach them to ask which course they
 * are in.
 */
export const CERTIFICATES_COURSE: Course = {
  id: "https-with-your-own-certificates",
  title: "HTTPS with your own certificates",
  summary:
    "Make a certificate chain of your own, then put it to work: the padlock in your browser, nginx as a reverse proxy in front of a real site, and Java taught to trust what you made. Ends with a test.",
  status: "available",
  lessonSlugs: ["certificates", "deploy"],
};

/**
 * What Teacher teaches, in the order the home page lists it. A new course is
 * an entry here plus its content under `content/lessons/<slug>`; while that
 * content does not exist the entry stays "coming-soon" and names no lesson,
 * so nothing can link a student to a page that would fail to load.
 */
export const COURSES: ReadonlyArray<Course> = [
  CERTIFICATES_COURSE,
  {
    id: "docker",
    title: "Docker",
    summary:
      "You have already used Docker: in the deploy lesson, one command started a whole website, and nobody told you what it did. This course does. What a container actually is, how to build an image of your own, and how to run it like a real thing, ending with your image behind your own certificate on https.",
    status: "coming-soon",
    lessonSlugs: [],
  },
];

/** The course a lesson belongs to, or null when no course claims the slug. */
export function courseFor(slug: string): Course | null {
  return COURSES.find((course) => course.lessonSlugs.includes(slug)) ?? null;
}

/**
 * The course with this id, or null. An id comes back out of the database as
 * a string, so an unknown one is data from another version of the catalog,
 * not a crash.
 */
export function courseById(id: string): Course | null {
  return COURSES.find((course) => course.id === id) ?? null;
}

/** Where a course starts, or null when there is nothing to open yet. */
export function courseStartPath(course: Course): string | null {
  const first = course.lessonSlugs[0];
  return course.status === "available" && first !== undefined
    ? lessonPath(first)
    : null;
}
