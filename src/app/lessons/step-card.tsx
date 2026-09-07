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
        className="text-xl font-semibold text-balance text-strong"
      >
        {step.title}
      </h2>
      <div className="mt-2 text-body">
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
      ? "border-accent bg-accent text-on-accent"
      : state === "next"
        ? "border-done-solid bg-surface text-done-ink-soft ring-4 ring-done-ring"
        : "border-line bg-surface text-faint";
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
        <span className="inline-flex items-center gap-2 text-sm font-medium text-strong">
          <Check /> Done
        </span>
        <button
          type="submit"
          className="min-h-10 rounded px-2 text-sm text-muted underline underline-offset-2 hover:text-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
        className={`min-h-11 rounded px-4 font-medium transition-[background-color,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.97] ${
          state === "next"
            ? "bg-accent text-on-accent hover:bg-accent-hover"
            : "border border-line-strong bg-surface text-strong hover:bg-sunken"
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
