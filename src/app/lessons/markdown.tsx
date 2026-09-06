import { isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./code-block";

/**
 * Renders lesson markdown. Fenced code becomes a CodeBlock with a label and a
 * copy button; everything else is styled by .lesson-body in globals.css.
 * react-markdown builds elements, never raw HTML, so content cannot inject
 * markup even by accident.
 */
export function Markdown({ text }: { text: string }) {
  return (
    <div className="lesson-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ pre: Pre }}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

function Pre({ children }: { children?: ReactNode }) {
  const code = isValidElement<{ className?: string; children?: ReactNode }>(
    children,
  )
    ? children.props
    : undefined;
  const language = /language-(\w+)/.exec(code?.className ?? "")?.[1] ?? "text";
  const text = childrenToText(code?.children).replace(/\n$/, "");
  return <CodeBlock language={language} text={text} />;
}

function childrenToText(children: ReactNode): string {
  if (typeof children === "string") {
    return children;
  }
  if (Array.isArray(children)) {
    return children.map(childrenToText).join("");
  }
  return "";
}
