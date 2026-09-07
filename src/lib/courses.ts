import { COURSE_SLUGS, lessonPath } from "@/lib/lesson-routes";

/**
 * Whether a course can be worked through yet. A course that is announced but
 * not written is listed so a student can see what is coming; it links nowhere.
 */
export type CourseStatus = "available" | "coming-soon";

export type Course = Readonly<{
  /** Stable identifier. Not a URL: a course is reached through its lessons. */
  id: string;
  title: string;
  /** What a student reads on the home page, in plain words. */
  summary: string;
  status: CourseStatus;
  /** The lessons it is made of, in order. Empty until the course is written. */
  lessonSlugs: ReadonlyArray<string>;
}>;

/**
 * What Teacher teaches, in the order the home page lists it. A new course is
 * an entry here plus its content under `content/lessons/<slug>`; while that
 * content does not exist the entry stays "coming-soon" and names no lesson,
 * so nothing can link a student to a page that would fail to load.
 */
export const COURSES: ReadonlyArray<Course> = [
  {
    id: "https-with-your-own-certificates",
    title: "HTTPS with your own certificates",
    summary:
      "Make a certificate chain of your own, then put it to work: the padlock in your browser, nginx as a reverse proxy in front of a real site, and Java taught to trust what you made. Ends with a test.",
    status: "available",
    lessonSlugs: COURSE_SLUGS,
  },
  {
    id: "kubernetes",
    title: "Kubernetes",
    summary:
      "Run a site in a cluster: what a pod, a service, and an ingress are, and where your certificate goes once nginx is no longer yours to edit.",
    status: "coming-soon",
    lessonSlugs: [],
  },
];

/** Where a course starts, or null when there is nothing to open yet. */
export function courseStartPath(course: Course): string | null {
  const first = course.lessonSlugs[0];
  return course.status === "available" && first !== undefined
    ? lessonPath(first)
    : null;
}
