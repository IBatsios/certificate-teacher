import Link from "next/link";
import { listArchivedSessions, startOrResume } from "@/lib/learning-session";
import { loadLesson } from "@/lib/lesson";
import { lessonMessageFor } from "@/lib/lesson-routes";
import { requireRole } from "@/lib/session";
import { LessonView } from "../lesson-view";
import { markDone, markNotDone, startOverAction } from "./actions";

const LESSON_SLUG = "certificates";

const FINISHED = {
  title: "Every step is done",
  body: (
    <>
      You have a root and a leaf on your computer, and you have seen the chain
      between them. The deploy lesson, which puts them to work, arrives next.
      Until then you can{" "}
      <Link href="/test" className="underline underline-offset-2">
        take the test
      </Link>
      .
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
