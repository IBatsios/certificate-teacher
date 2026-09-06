"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  markStepDone,
  markStepNotDone,
  startOver,
} from "@/lib/learning-session";
import { loadLesson } from "@/lib/lesson";
import { requireRole } from "@/lib/session";
import {
  CERTIFICATES_LESSON_PATH,
  lessonPageAtStep,
  lessonPageWithMessage,
} from "./messages";

const LESSON_SLUG = "certificates";

const MAX_STEP_KEY_LENGTH = 64;
const stepFormSchema = z.object({
  stepKey: z.string().min(1).max(MAX_STEP_KEY_LENGTH),
});

/** Ticks a step. Redirects happen outside try/catch because `redirect` throws. */
export async function markDone(formData: FormData): Promise<void> {
  const student = await requireRole("student");
  const stepKey = await readStepKey(formData);
  if (stepKey === null) {
    redirect(lessonPageWithMessage("unknown-step"));
  }
  const outcome = await trySave(() => markStepDone(student.id, stepKey));
  redirect(outcome ?? lessonPageAtStep(stepKey));
}

/** Un-ticks a step. */
export async function markNotDone(formData: FormData): Promise<void> {
  const student = await requireRole("student");
  const stepKey = await readStepKey(formData);
  if (stepKey === null) {
    redirect(lessonPageWithMessage("unknown-step"));
  }
  const outcome = await trySave(() => markStepNotDone(student.id, stepKey));
  redirect(outcome ?? lessonPageAtStep(stepKey));
}

/** Archives the current session and starts an empty one. */
export async function startOverAction(): Promise<void> {
  const student = await requireRole("student");
  const outcome = await trySave(() => startOver(student.id));
  redirect(outcome ?? lessonPageWithMessage("started-over"));
}

/** The submitted step key, or null unless it is a step of this lesson. */
async function readStepKey(formData: FormData): Promise<string | null> {
  const parsed = stepFormSchema.safeParse({ stepKey: formData.get("stepKey") });
  if (!parsed.success) {
    return null;
  }
  const lesson = await loadLesson(LESSON_SLUG);
  const isKnown = lesson.steps.some((step) => step.key === parsed.data.stepKey);
  return isKnown ? parsed.data.stepKey : null;
}

/**
 * Runs a save; null on success, otherwise the page to send the student to.
 * Revalidating the lesson path makes the action's response carry the freshly
 * rendered page: a redirect to the same path with only a hash added would
 * otherwise be treated as a scroll and leave the old state on screen.
 */
async function trySave(save: () => Promise<unknown>): Promise<string | null> {
  try {
    await save();
    revalidatePath(CERTIFICATES_LESSON_PATH);
    return null;
  } catch (error) {
    console.error("Could not save lesson progress", error);
    return lessonPageWithMessage("not-saved");
  }
}
