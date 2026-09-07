import { describe, expect, test } from "vitest";
import {
  COURSES,
  courseStartPath,
  type Course,
  type CourseStatus,
} from "@/lib/courses";
import { loadLesson } from "@/lib/lesson";
import { COURSE_SLUGS } from "@/lib/lesson-routes";

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
    // page and the admin report already count.
    expect(available).toHaveLength(1);
    expect(available[0].lessonSlugs).toEqual([...COURSE_SLUGS]);
  });

  test("announces Kubernetes without pretending it exists", () => {
    // Act
    const kubernetes = COURSES.find((course) => course.id === "kubernetes");

    // Assert
    expect(kubernetes?.status).toBe("coming-soon");
    expect(kubernetes?.lessonSlugs).toEqual([]);
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
      id: "kubernetes",
      title: "Kubernetes",
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
