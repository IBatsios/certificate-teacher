// What ticking a step, un-ticking one, and starting over do, for any lesson.
//
// This is deliberately not a `"use server"` module: such a module may only
// export async functions, so it cannot export a factory. Each lesson keeps a
// small `actions.ts` that declares the real server actions and hands its slug
// to the functions here.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
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

const MAX_STEP_KEY_LENGTH = 64;
const stepFormSchema = z.object({
  stepKey: z.string().min(1).max(MAX_STEP_KEY_LENGTH),
});

/** Ticks a step. Redirects happen outside try/catch because `redirect` throws. */
export async function tickStep(
  slug: string,
  formData: FormData,
): Promise<void> {
  const student = await requireRole("student");
  const stepKey = await readStepKey(slug, formData);
  if (stepKey === null) {
    redirect(lessonPathWithMessage(slug, "unknown-step"));
  }
  const outcome = await trySave(slug, () => markStepDone(student.id, stepKey));
  redirect(outcome ?? lessonPathAtStep(slug, stepKey));
}

/** Un-ticks a step. */
export async function untickStep(
  slug: string,
  formData: FormData,
): Promise<void> {
  const student = await requireRole("student");
  const stepKey = await readStepKey(slug, formData);
  if (stepKey === null) {
    redirect(lessonPathWithMessage(slug, "unknown-step"));
  }
  const outcome = await trySave(slug, () =>
    markStepNotDone(student.id, stepKey),
  );
  redirect(outcome ?? lessonPathAtStep(slug, stepKey));
}

/** Archives the current session and starts an empty one. */
export async function restartSession(slug: string): Promise<void> {
  const student = await requireRole("student");
  const outcome = await trySave(slug, () => startOver(student.id));
  redirect(outcome ?? lessonPathWithMessage(slug, "started-over"));
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
