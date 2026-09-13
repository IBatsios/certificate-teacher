import { describe, expect, test } from "vitest";
import {
  CERTIFICATES_COURSE,
  COURSES,
  courseById,
  courseFor,
  courseStartPath,
  lessonCountLabel,
  lessonNumber,
  type Course,
  type CourseStatus,
} from "@/lib/courses";
import { loadLesson } from "@/lib/lesson";

function withStatus(status: CourseStatus): ReadonlyArray<Course> {
  return COURSES.filter((course) => course.status === status);
}

/** The Docker course, which the catalog lists by id rather than exporting. */
function dockerCourse(): Course {
  const docker = courseById("docker");
  if (docker === null) {
    throw new Error("The catalog no longer lists the Docker course.");
  }
  return docker;
}

/** A course with this many lessons, for the label that counts them. */
function withLessons(count: number): Course {
  return {
    id: "example",
    title: "Example",
    summary: "An example.",
    status: "available",
    lessonSlugs: Array.from({ length: count }, (_, i) => `lesson-${i + 1}`),
  };
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

  test("lists both courses as ones a student can start", () => {
    // Act
    const available = withStatus("available");

    // Assert: the certificates course is the two lessons the test page and
    // the admin report count, and Docker is the three lessons of v2.
    expect(available.map((course) => course.id)).toEqual([
      CERTIFICATES_COURSE.id,
      "docker",
    ]);
    expect(CERTIFICATES_COURSE.lessonSlugs).toEqual(["certificates", "deploy"]);
  });

  test("runs the Docker course from containers, through building an image, to running it properly", () => {
    // Act
    const docker = dockerCourse();

    // Assert: available from Task 12 on. Lessons landed at the end as they
    // were written, so the earlier ones stayed where students found them.
    expect(docker.status).toBe("available");
    expect(docker.lessonSlugs).toEqual([
      "containers",
      "build-an-image",
      "run-it-properly",
    ]);
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
    // home page can send a student to a lesson that has no content. Every
    // course is available since Task 12, so the first loop guards the next
    // course announced rather than one that exists today.
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
    expect(courseFor("containers")).toBe(dockerCourse());
    expect(courseFor("build-an-image")).toBe(dockerCourse());
    expect(courseFor("run-it-properly")).toBe(dockerCourse());
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
    expect(courseById("docker")?.title).toBe("Docker");
  });

  test("is null for an id no course has", () => {
    // An id comes back out of the database as a string, and a course could be
    // retired after sessions were stored against it.
    expect(courseById("retired-course")).toBeNull();
  });
});

describe("lessonNumber", () => {
  test("counts a lesson's place in its course from one", () => {
    expect(lessonNumber(CERTIFICATES_COURSE, "certificates")).toBe(1);
    expect(lessonNumber(CERTIFICATES_COURSE, "deploy")).toBe(2);
    expect(lessonNumber(dockerCourse(), "containers")).toBe(1);
    expect(lessonNumber(dockerCourse(), "build-an-image")).toBe(2);
    expect(lessonNumber(dockerCourse(), "run-it-properly")).toBe(3);
  });

  test("refuses a lesson the course does not claim", () => {
    // The route resolves the course from the slug first, so reaching this
    // with a foreign slug is a bug, and a quiet 0 would hide it.
    expect(() => lessonNumber(CERTIFICATES_COURSE, "kubernetes")).toThrow(
      /kubernetes/,
    );
  });
});

describe("lessonCountLabel", () => {
  test("counts a course's lessons in the singular and the plural", () => {
    // The home page reads this out. "1 lessons and a test" is what the
    // Docker course would have said while it had one lesson.
    expect(lessonCountLabel(withLessons(1))).toBe("1 lesson and a test");
    expect(lessonCountLabel(withLessons(2))).toBe("2 lessons and a test");
    expect(lessonCountLabel(withLessons(3))).toBe("3 lessons and a test");
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
      id: "later",
      title: "Later",
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
