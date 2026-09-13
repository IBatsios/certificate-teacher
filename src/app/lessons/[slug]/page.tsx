import { notFound } from "next/navigation";
import { courseFor, lessonNumber } from "@/lib/courses";
import { listArchivedSessions, startOrResume } from "@/lib/learning-session";
import { loadCourseLessons, type Lesson } from "@/lib/lesson";
import { courseProgress } from "@/lib/lesson-progress";
import { lessonMessageFor } from "@/lib/lesson-routes";
import { requireRole } from "@/lib/session";
import { LessonView } from "../lesson-view";
import { markDone, markNotDone, startOverAction } from "./actions";

/**
 * Every lesson, at /lessons/<slug>. The catalog says which course the slug
 * belongs to, the course says which lessons count towards "finished", and
 * the lesson folder says everything else. A slug no course claims is a 404
 * before anything is looked at, the same answer an unknown address got when
 * each lesson was its own directory.
 */
export default async function LessonPage({
  params,
  searchParams,
}: PageProps<"/lessons/[slug]">) {
  const { slug } = await params;
  const course = courseFor(slug);
  if (course === null) {
    notFound();
  }
  const student = await requireRole("student");
  const query = await searchParams;
  const [lessons, session, earlier] = await Promise.all([
    loadCourseLessons(course),
    startOrResume(student.id, course.id),
    listArchivedSessions(student.id, course.id),
  ]);
  const lesson = lessonIn(lessons, slug);
  const wholeCourse = courseProgress(
    lessons,
    new Set(session.doneStepKeys),
  ).isComplete;

  return (
    <LessonView
      lesson={lesson}
      session={session}
      earlier={earlier}
      eyebrow={`Lesson ${lessonNumber(course, slug)}`}
      message={lessonMessageFor(query.message)}
      // Finishing this lesson is not always finishing the course, so a lesson
      // may carry a note for each; the course one only shows once every step
      // of every lesson is ticked.
      finished={
        wholeCourse && lesson.courseFinished !== null
          ? lesson.courseFinished
          : lesson.finished
      }
      markDone={markDone.bind(null, slug)}
      markNotDone={markNotDone.bind(null, slug)}
      startOverAction={startOverAction.bind(null, slug)}
    />
  );
}

/**
 * This page's lesson, out of its course's lessons. The catalog claimed the
 * slug and the course was loaded from the catalog, so a miss is a mistake in
 * code, not something a student can cause.
 */
function lessonIn(lessons: ReadonlyArray<Lesson>, slug: string): Lesson {
  const lesson = lessons.find((candidate) => candidate.slug === slug);
  if (lesson === undefined) {
    throw new Error(`The "${slug}" lesson did not load with its course.`);
  }
  return lesson;
}
