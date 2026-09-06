"use client";

import { useEffect, useState } from "react";

const COPIED_FOR_MS = 1500;

/** Puts a command on the clipboard. The one client component in the lessons. */
export function CopyButton({ text }: { text: string }) {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) {
      return;
    }
    const timer = setTimeout(() => setIsCopied(false), COPIED_FOR_MS);
    return () => clearTimeout(timer);
  }, [isCopied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
    } catch {
      // Clipboard access can be refused; the text is still on screen to select.
      setIsCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className="min-h-10 rounded px-3 text-xs font-medium text-neutral-600 transition-[background-color,transform] duration-150 ease-out hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black active:scale-[0.97]"
    >
      {isCopied ? "Copied" : "Copy"}
    </button>
  );
}
