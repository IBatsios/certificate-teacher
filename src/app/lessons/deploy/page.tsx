import Link from "next/link";
import { listArchivedSessions, startOrResume } from "@/lib/learning-session";
import { loadLesson } from "@/lib/lesson";
import { courseProgress } from "@/lib/lesson-progress";
import { lessonMessageFor, lessonPath } from "@/lib/lesson-routes";
import { VERIFY_PATH } from "../verify/messages";
import { requireRole } from "@/lib/session";
import { LessonView } from "../lesson-view";
import { markDone, markNotDone, startOverAction } from "./actions";

const LESSON_SLUG = "deploy";
const FIRST_LESSON_SLUG = "certificates";

// Finishing this lesson is not always finishing the course: the steps of the
// first lesson can still be untouched, so the note says which it is.
const COURSE_FINISHED = {
  title: "That is the whole course",
  body: (
    <>
      You made a certificate, served it, trusted it, looked behind the proxy
      that presented it, and taught Java to accept it. Nothing about the
      certificate changed along the way, only who was willing to believe it. If
      you have not already, you can{" "}
      <Link href={VERIFY_PATH} className="underline underline-offset-2">
        have your certificate checked
      </Link>
      . When you are ready,{" "}
      <Link href="/test" className="underline underline-offset-2">
        take the test
      </Link>
      .
    </>
  ),
};

const LESSON_FINISHED = {
  title: "Every step of this lesson is done",
  body: (
    <>
      Your certificate is serving a real site, your browser trusts it, and Java
      does too. A few steps of{" "}
      <Link
        href={lessonPath(FIRST_LESSON_SLUG)}
        className="underline underline-offset-2"
      >
        the first lesson
      </Link>{" "}
      are still unticked; finish those and the course is complete.
    </>
  ),
};

export default async function DeployLessonPage({
  searchParams,
}: PageProps<"/lessons/deploy">) {
  const student = await requireRole("student");
  const params = await searchParams;
  const [firstLesson, lesson, session, earlier] = await Promise.all([
    loadLesson(FIRST_LESSON_SLUG),
    loadLesson(LESSON_SLUG),
    startOrResume(student.id),
    listArchivedSessions(student.id),
  ]);
  const course = courseProgress(
    [firstLesson, lesson],
    new Set(session.doneStepKeys),
  );

  return (
    <LessonView
      lesson={lesson}
      session={session}
      earlier={earlier}
      eyebrow="Lesson 2"
      message={lessonMessageFor(params.message)}
      finished={course.isComplete ? COURSE_FINISHED : LESSON_FINISHED}
      markDone={markDone}
      markNotDone={markNotDone}
      startOverAction={startOverAction}
    />
  );
}
