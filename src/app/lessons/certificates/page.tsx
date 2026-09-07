import Link from "next/link";
import { listArchivedSessions, startOrResume } from "@/lib/learning-session";
import { loadLesson } from "@/lib/lesson";
import { lessonMessageFor, lessonPath } from "@/lib/lesson-routes";
import { requireRole } from "@/lib/session";
import { LessonView } from "../lesson-view";
import { markDone, markNotDone, startOverAction } from "./actions";

const LESSON_SLUG = "certificates";
const NEXT_LESSON_SLUG = "deploy";

const FINISHED = {
  title: "Every step is done",
  body: (
    <>
      You have a root and a leaf on your computer, and you have seen the chain
      between them. Now put them to work:{" "}
      <Link
        href={lessonPath(NEXT_LESSON_SLUG)}
        className="underline underline-offset-2"
      >
        the deploy lesson
      </Link>{" "}
      turns them into a real https website, shows you what a reverse proxy does,
      and teaches Java to trust what you made.
    </>
  ),
};

export default async function CertificatesLessonPage({
  searchParams,
}: PageProps<"/lessons/certificates">) {
  const student = await requireRole("student");
  const params = await searchParams;
  const [lesson, session, earlier] = await Promise.all([
    loadLesson(LESSON_SLUG),
    startOrResume(student.id),
    listArchivedSessions(student.id),
  ]);

  return (
    <LessonView
      lesson={lesson}
      session={session}
      earlier={earlier}
      eyebrow="Lesson 1"
      message={lessonMessageFor(params.message)}
      finished={FINISHED}
      markDone={markDone}
      markNotDone={markNotDone}
      startOverAction={startOverAction}
    />
  );
}
