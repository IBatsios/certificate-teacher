import { CopyButton } from "./copy-button";

// The fence language in the markdown says who a block is for. Anything else
// is shown as plain text without a copy button.
const LABEL_BY_LANGUAGE: Readonly<Record<string, string>> = {
  shell: "Same command in PowerShell and Terminal",
  powershell: "Windows, in PowerShell",
  bash: "Mac or Linux, in Terminal",
  text: "What you should see",
};

const COPYABLE_LANGUAGES: ReadonlySet<string> = new Set([
  "shell",
  "powershell",
  "bash",
]);

export function CodeBlock({
  language,
  text,
}: {
  language: string;
  text: string;
}) {
  const label = LABEL_BY_LANGUAGE[language] ?? LABEL_BY_LANGUAGE.text;
  const isCommand = COPYABLE_LANGUAGES.has(language);

  return (
    <figure className="my-4 overflow-hidden rounded-lg border border-neutral-300 bg-neutral-50">
      <figcaption className="flex items-center justify-between gap-3 border-b border-neutral-200 py-1 pr-1 pl-3 text-xs text-neutral-600">
        <span>{label}</span>
        {isCommand && <CopyButton text={text} />}
      </figcaption>
      <pre className="overflow-x-auto p-3 font-mono text-sm leading-relaxed text-neutral-900">
        <code>{text}</code>
      </pre>
    </figure>
  );
}
