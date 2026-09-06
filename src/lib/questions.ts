export type Choice = Readonly<{
  id: string;
  label: string;
}>;

export type Question = Readonly<{
  id: string;
  prompt: string;
  choices: ReadonlyArray<Choice>;
  correctChoiceId: string;
}>;

/**
 * The walking skeleton asks one question. Task 06 replaces this with the full
 * question bank in content/test/questions.json, grouped by topic.
 */
export const QUESTIONS: ReadonlyArray<Question> = [
  {
    id: "trust-anchor",
    prompt:
      "Which certificate in a chain does your browser trust without checking a signature?",
    choices: [
      {
        id: "root",
        label:
          "The root certificate, because it is already installed on the computer",
      },
      {
        id: "intermediate",
        label: "The intermediate certificate, because it signs the others",
      },
      {
        id: "leaf",
        label: "The website's own certificate, because it names the site",
      },
    ],
    correctChoiceId: "root",
  },
];
