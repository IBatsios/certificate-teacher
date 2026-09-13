"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { courseFor, type Course } from "@/lib/courses";
import {
  markStepDone,
  markStepNotDone,
  startOver,
} from "@/lib/learning-session";
import { loadLesson } from "@/lib/lesson";
import {
  lessonPath,
  lessonPathAtStep,
  lessonPathWithMessage,
} from "@/lib/lesson-routes";
import { requireRole } from "@/lib/session";

// The three things a student can do on a lesson page, for every lesson. The
// page binds its slug as the first argument. A bound argument travels through
// the browser and back, so it is treated like anything else a request
// carries: the catalog has to claim it before anything is read or written,
// and a slug no course claims is a 404.

const MAX_STEP_KEY_LENGTH = 64;
const stepFormSchema = z.object({
  stepKey: z.string().min(1).max(MAX_STEP_KEY_LENGTH),
});

/** Ticks a step. Redirects happen outside try/catch because `redirect` throws. */
export async function markDone(
  slug: string,
  formData: FormData,
): Promise<void> {
  const course = courseOf(slug);
  const student = await requireRole("student");
  const stepKey = await readStepKey(slug, formData);
  if (stepKey === null) {
    redirect(lessonPathWithMessage(slug, "unknown-step"));
  }
  const outcome = await trySave(slug, () =>
    markStepDone(student.id, course.id, stepKey),
  );
  redirect(outcome ?? lessonPathAtStep(slug, stepKey));
}

/** Un-ticks a step. */
export async function markNotDone(
  slug: string,
  formData: FormData,
): Promise<void> {
  const course = courseOf(slug);
  const student = await requireRole("student");
  const stepKey = await readStepKey(slug, formData);
  if (stepKey === null) {
    redirect(lessonPathWithMessage(slug, "unknown-step"));
  }
  const outcome = await trySave(slug, () =>
    markStepNotDone(student.id, course.id, stepKey),
  );
  redirect(outcome ?? lessonPathAtStep(slug, stepKey));
}

/** Archives the current session in the lesson's course and starts an empty one. */
export async function startOverAction(slug: string): Promise<void> {
  const course = courseOf(slug);
  const student = await requireRole("student");
  const outcome = await trySave(slug, () => startOver(student.id, course.id));
  redirect(outcome ?? lessonPathWithMessage(slug, "started-over"));
}

/** The course that claims the slug. A slug none claims is a 404. */
function courseOf(slug: string): Course {
  const course = courseFor(slug);
  if (course === null) {
    notFound();
  }
  return course;
}

/** The submitted step key, or null unless it is a step of this lesson. */
async function readStepKey(
  slug: string,
  formData: FormData,
): Promise<string | null> {
  const parsed = stepFormSchema.safeParse({ stepKey: formData.get("stepKey") });
  if (!parsed.success) {
    return null;
  }
  const lesson = await loadLesson(slug);
  const isKnown = lesson.steps.some((step) => step.key === parsed.data.stepKey);
  return isKnown ? parsed.data.stepKey : null;
}

/**
 * Runs a save; null on success, otherwise the page to send the student to.
 * Revalidating the lesson path makes the action's response carry the freshly
 * rendered page: a redirect to the same path with only a hash added would
 * otherwise be treated as a scroll and leave the old state on screen.
 */
async function trySave(
  slug: string,
  save: () => Promise<unknown>,
): Promise<string | null> {
  try {
    await save();
    revalidatePath(lessonPath(slug));
    return null;
  } catch (error) {
    console.error("Could not save lesson progress", error);
    return lessonPathWithMessage(slug, "not-saved");
  }
}
