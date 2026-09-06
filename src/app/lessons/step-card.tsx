import type { LessonStep } from "@/lib/lesson";
import { Markdown } from "./markdown";

export type StepState = "done" | "next" | "later";

type StepCardProps = {
  step: LessonStep;
  state: StepState;
  /** Server actions from the lesson page; each reads the hidden `stepKey`. */
  markDone: (formData: FormData) => Promise<void>;
  markNotDone: (formData: FormData) => Promise<void>;
};

/**
 * One lesson step: a number on the spine, the text, and the tick. The spine
 * fills as steps are done and rings the next one, so a returning student
 * sees where they are before reading a word.
 */
export function StepCard({
  step,
  state,
  markDone,
  markNotDone,
}: StepCardProps) {
  const headingId = `step-${step.key}-title`;
  return (
    <section
      id={`step-${step.key}`}
      aria-labelledby={headingId}
      className="relative scroll-mt-6 pl-14"
    >
      <SpineMarker order={step.order} state={state} />
      <h2
        id={headingId}
        className="text-xl font-semibold text-balance text-neutral-900"
      >
        {step.title}
      </h2>
      <div className="mt-2 text-neutral-800">
        <Markdown text={step.body} />
      </div>
      <Tick
        stepKey={step.key}
        state={state}
        markDone={markDone}
        markNotDone={markNotDone}
      />
    </section>
  );
}

function SpineMarker({ order, state }: { order: number; state: StepState }) {
  const ring =
    state === "done"
      ? "border-neutral-900 bg-neutral-900 text-white"
      : state === "next"
        ? "border-emerald-600 bg-white text-emerald-700 ring-4 ring-emerald-100"
        : "border-neutral-300 bg-white text-neutral-500";
  return (
    <span
      aria-hidden="true"
      className={`absolute top-0 left-0 flex size-10 items-center justify-center rounded-full border-2 text-sm font-semibold tabular-nums ${ring}`}
    >
      {state === "done" ? <Check /> : order}
    </span>
  );
}

function Tick({
  stepKey,
  state,
  markDone,
  markNotDone,
}: {
  stepKey: string;
  state: StepState;
  markDone: (formData: FormData) => Promise<void>;
  markNotDone: (formData: FormData) => Promise<void>;
}) {
  if (state === "done") {
    return (
      <form action={markNotDone} className="mt-4 flex items-center gap-4">
        <input type="hidden" name="stepKey" value={stepKey} />
        <span className="inline-flex items-center gap-2 text-sm font-medium text-neutral-900">
          <Check /> Done
        </span>
        <button
          type="submit"
          className="min-h-10 rounded px-2 text-sm text-neutral-600 underline underline-offset-2 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          Undo
        </button>
      </form>
    );
  }
  return (
    <form action={markDone} className="mt-4">
      <input type="hidden" name="stepKey" value={stepKey} />
      <button
        type="submit"
        className={`min-h-11 rounded px-4 font-medium transition-[background-color,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black active:scale-[0.97] ${
          state === "next"
            ? "bg-neutral-900 text-white hover:bg-neutral-700"
            : "border border-neutral-400 bg-white text-neutral-900 hover:bg-neutral-100"
        }`}
      >
        Mark done
      </button>
    </form>
  );
}

function Check() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  );
}
