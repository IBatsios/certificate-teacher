import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";

// The test's questions, written by the developer as JSON under content/test
// and read at runtime. The file is edited by hand, so it is validated like any
// other input from outside the program: the mistakes an edit makes are a typo
// in a topic name, a correct answer that is not on the list, or a repeated id,
// and none of those are type errors.

/** Below this a topic's score says too little to name it a focus area. */
export const QUESTIONS_PER_TOPIC_MINIMUM = 3;

const BANK_FILE = path.join(process.cwd(), "content", "test", "questions.json");

export type Choice = Readonly<{
  id: string;
  label: string;
}>;

export type Topic = Readonly<{
  id: string;
  title: string;
}>;

export type Question = Readonly<{
  id: string;
  /** The id of the topic this belongs to. */
  topic: string;
  prompt: string;
  choices: ReadonlyArray<Choice>;
  correctChoiceId: string;
}>;

export type QuestionBank = Readonly<{
  topics: ReadonlyArray<Topic>;
  questions: ReadonlyArray<Question>;
}>;

const choiceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

const topicSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
});

const questionSchema = z.object({
  id: z.string().min(1),
  topic: z.string().min(1),
  prompt: z.string().min(1),
  // Two is the fewest that asks anything; the bank uses three.
  choices: z.array(choiceSchema).min(2),
  correctChoiceId: z.string().min(1),
});

const bankSchema = z.object({
  topics: z.array(topicSchema).min(1),
  questions: z.array(questionSchema).min(1),
});

/**
 * Turns parsed JSON into a question bank, or throws saying what is wrong.
 * Pure; exported for its tests.
 */
export function parseQuestionBank(value: unknown): QuestionBank {
  const bank = bankSchema.parse(value);

  assertDistinct(
    bank.topics.map((topic) => topic.id),
    "Topic",
  );
  assertDistinct(
    bank.questions.map((question) => question.id),
    "Question",
  );

  const topicIds = new Set(bank.topics.map((topic) => topic.id));
  for (const question of bank.questions) {
    if (!topicIds.has(question.topic)) {
      throw new Error(
        `Question "${question.id}" has the topic "${question.topic}", which is not declared in topics.`,
      );
    }
    assertDistinct(
      question.choices.map((choice) => choice.id),
      `Choice in question "${question.id}"`,
    );
    const offered = question.choices.some(
      (choice) => choice.id === question.correctChoiceId,
    );
    if (!offered) {
      throw new Error(
        `Question "${question.id}" says the correct answer is "${question.correctChoiceId}", which is not one of its choices.`,
      );
    }
  }

  return bank;
}

/** Reads the question bank from disk. Throws when the file is wrong. */
export async function loadQuestionBank(): Promise<QuestionBank> {
  const text = await fs.readFile(BANK_FILE, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(`${BANK_FILE} is not valid JSON.`, { cause: error });
  }
  return parseQuestionBank(parsed);
}

function assertDistinct(ids: ReadonlyArray<string>, what: string): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      throw new Error(`${what} id "${id}" is used twice.`);
    }
    seen.add(id);
  }
}
