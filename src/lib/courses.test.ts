import { describe, expect, test } from "vitest";
import {
  CERTIFICATES_COURSE,
  COURSES,
  courseById,
  courseFor,
  courseStartPath,
  type Course,
  type CourseStatus,
} from "@/lib/courses";
import { loadLesson } from "@/lib/lesson";

function withStatus(status: CourseStatus): ReadonlyArray<Course> {
  return COURSES.filter((course) => course.status === status);
}

describe("COURSES", () => {
  test("names every course once", () => {
    // Act
    const ids = COURSES.map((course) => course.id);

    // Assert
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("gives every course a title and a summary to read", () => {
    for (const course of COURSES) {
      expect(course.title.trim().length).toBeGreaterThan(0);
      expect(course.summary.trim().length).toBeGreaterThan(0);
    }
  });

  test("lists the certificates course as the one a student can start", () => {
    // Act
    const available = withStatus("available");

    // Assert: the course a student works through is the two lessons the test
    // page and the admin report count, and the catalog is where that is said.
    expect(available).toEqual([CERTIFICATES_COURSE]);
    expect(CERTIFICATES_COURSE.lessonSlugs).toEqual(["certificates", "deploy"]);
  });

  test("announces Docker without pretending it exists", () => {
    // Act
    const docker = courseById("docker");

    // Assert
    expect(docker?.status).toBe("coming-soon");
    expect(docker?.lessonSlugs).toEqual([]);
  });

  test("no longer announces Kubernetes", () => {
    // Docker replaced it (docs/handoff-items/handoff-docker-course-plan.md).
    expect(courseById("kubernetes")).toBeNull();
    expect(COURSES.some((course) => /kubernetes/i.test(course.title))).toBe(
      false,
    );
  });

  test("lists the certificates course first and Docker second", () => {
    // The finished course leads; Docker opens by saying the student has
    // already used it in the deploy lesson, which only reads right after it.
    expect(COURSES.map((course) => course.id)).toEqual([
      CERTIFICATES_COURSE.id,
      "docker",
    ]);
  });

  test("gives a course lessons only once it is available", () => {
    // Assert: a course still being written links nowhere, so nothing on the
    // home page can send a student to a lesson that has no content.
    for (const course of withStatus("coming-soon")) {
      expect(course.lessonSlugs).toEqual([]);
    }
    for (const course of withStatus("available")) {
      expect(course.lessonSlugs.length).toBeGreaterThan(0);
    }
  });

  test("no two courses claim the same lesson", () => {
    // Arrange: a lesson's progress is stored against one course's session, so
    // a slug in two courses would count for both.
    const slugs = COURSES.flatMap((course) => course.lessonSlugs);

    // Assert
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test("names lessons that are written", async () => {
    // Act: every slug an available course claims is a folder under content.
    const loads = withStatus("available").flatMap((course) =>
      course.lessonSlugs.map((slug) => loadLesson(slug)),
    );

    // Assert
    for (const load of loads) {
      await expect(load).resolves.toMatchObject({ slug: expect.any(String) });
    }
  });
});

describe("courseFor", () => {
  test("finds the course a lesson belongs to", () => {
    expect(courseFor("certificates")).toBe(CERTIFICATES_COURSE);
    expect(courseFor("deploy")).toBe(CERTIFICATES_COURSE);
  });

  test("is null for a slug no course claims", () => {
    // A URL can name anything; the route that resolves it needs a 404, not a
    // lesson with no steps.
    expect(courseFor("kubernetes")).toBeNull();
    expect(courseFor("")).toBeNull();
  });
});

describe("courseById", () => {
  test("finds a course by the id stored with its sessions", () => {
    expect(courseById("https-with-your-own-certificates")).toBe(
      CERTIFICATES_COURSE,
    );
  });

  test("is null for an id no course has", () => {
    // An id comes back out of the database as a string, and a course could be
    // retired after sessions were stored against it.
    expect(courseById("retired-course")).toBeNull();
  });
});

describe("courseStartPath", () => {
  test("points at the first lesson of a course a student can start", () => {
    // Arrange
    const course: Course = {
      id: "example",
      title: "Example",
      summary: "An example.",
      status: "available",
      lessonSlugs: ["certificates", "deploy"],
    };

    // Act
    const path = courseStartPath(course);

    // Assert
    expect(path).toBe("/lessons/certificates");
  });

  test("points nowhere for a course that is still coming", () => {
    // Arrange
    const course: Course = {
      id: "docker",
      title: "Docker",
      summary: "Later.",
      status: "coming-soon",
      lessonSlugs: [],
    };

    // Act
    const path = courseStartPath(course);

    // Assert
    expect(path).toBeNull();
  });

  test("points nowhere for a course that names no lesson", () => {
    // Arrange: a mistake in the catalog, not a state the app should reach.
    const course: Course = {
      id: "empty",
      title: "Empty",
      summary: "Nothing yet.",
      status: "available",
      lessonSlugs: [],
    };

    // Assert
    expect(courseStartPath(course)).toBeNull();
  });
});
