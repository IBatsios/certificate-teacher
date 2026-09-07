"use server";

import { restartSession, tickStep, untickStep } from "../lesson-actions";

// A `"use server"` module may only export async functions, so each lesson
// declares its actions here and the shared work lives in ../lesson-actions.
const LESSON_SLUG = "deploy";

/** Ticks a step. */
export async function markDone(formData: FormData): Promise<void> {
  await tickStep(LESSON_SLUG, formData);
}

/** Un-ticks a step. */
export async function markNotDone(formData: FormData): Promise<void> {
  await untickStep(LESSON_SLUG, formData);
}

/** Archives the current session and starts an empty one. */
export async function startOverAction(): Promise<void> {
  await restartSession(LESSON_SLUG);
}
