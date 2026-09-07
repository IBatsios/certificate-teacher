import Link from "next/link";
import { auth } from "@/auth";
import type { Role } from "@/generated/prisma/enums";
import { HOME_BY_ROLE, SIGN_IN_PATH } from "@/lib/access";
import { COURSES, courseStartPath, type Course } from "@/lib/courses";

export default async function Home() {
  const session = await auth();
  const user = session?.user;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-10 p-8">
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-semibold">Teacher</h1>
        <p>
          Learn how the security you rely on every day actually works, by
          building it yourself on your own machine. Each course ends with a test
          that confirms what you applied.
        </p>
        {user === undefined ? (
          <div className="flex gap-4">
            <Link
              href="/sign-in"
              className="rounded bg-black px-4 py-2 text-white"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded border border-black px-4 py-2"
            >
              Create an account
            </Link>
          </div>
        ) : user.role === "admin" ? (
          <Link
            href={HOME_BY_ROLE.admin}
            className="self-start rounded bg-black px-4 py-2 text-white"
          >
            See your students
          </Link>
        ) : null}
      </div>

      <section aria-labelledby="courses" className="flex flex-col gap-4">
        <h2
          id="courses"
          className="text-sm font-medium tracking-wide text-neutral-600 uppercase"
        >
          Courses
        </h2>
        <ul className="flex flex-col gap-4">
          {COURSES.map((course) => (
            <li key={course.id}>
              <CourseCard course={course} role={user?.role} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

/**
 * One course on the home page. A course still being written says so and links
 * nowhere; the one a student can start carries the call to action. An admin
 * gets none: the lessons are a student's area, so the link would only lead to
 * the forbidden page. `role` is undefined for a visitor who is not signed in.
 */
function CourseCard({ course, role }: { course: Course; role?: Role }) {
  const startPath = courseStartPath(course);
  const start =
    startPath === null || role === "admin"
      ? null
      : role === "student"
        ? { href: startPath, label: "Go to the lesson", filled: true }
        : { href: SIGN_IN_PATH, label: "Sign in to start", filled: false };

  return (
    <article
      className={`flex flex-col gap-3 rounded border p-5 ${
        startPath === null
          ? "border-dashed border-neutral-300"
          : "border-neutral-300"
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-lg font-semibold text-balance text-neutral-900">
          {course.title}
        </h3>
        {startPath === null ? (
          <p className="rounded-full border border-neutral-400 px-2 py-0.5 text-xs font-medium tracking-wide text-neutral-600 uppercase">
            Coming soon
          </p>
        ) : (
          <p className="text-sm text-neutral-600">
            {course.lessonSlugs.length} lessons and a test
          </p>
        )}
      </div>
      <p className="text-neutral-800">{course.summary}</p>
      {start !== null && (
        <Link
          href={start.href}
          className={`self-start rounded px-4 py-2 ${
            start.filled
              ? "bg-black text-white"
              : "border border-black text-neutral-900"
          }`}
        >
          {start.label}
        </Link>
      )}
    </article>
  );
}
