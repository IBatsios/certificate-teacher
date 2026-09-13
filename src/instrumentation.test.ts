import { existsSync, readFileSync, statSync } from "node:fs";
import { builtinModules } from "node:module";
import path from "node:path";
import { describe, expect, test } from "vitest";

// Next compiles src/instrumentation.ts for the Edge runtime as well as for
// Node, so every module the startup check reaches has to get by without
// Node's built-in modules. When one creeps in, `pnpm dev` warns on every
// compile ("A Node.js module is loaded ('node:crypto' ...) which is not
// supported in the Edge Runtime"), and the check would fail outright if it
// ever ran there (D75). This walks the imports statically, following only
// the project's own modules; a package from node_modules is not followed.

const SRC = path.join(process.cwd(), "src");
const ENTRY = path.join(SRC, "instrumentation.ts");
const EXTENSIONS = [".ts", ".tsx"];

const TYPE_ONLY_IMPORT = /import\s+type\s[\s\S]*?from\s+["'][^"']+["']/g;
const SPECIFIER =
  /\bfrom\s+["']([^"']+)["']|\bimport\s*\(\s*["']([^"']+)["']\s*\)|^\s*import\s+["']([^"']+)["']/gm;

/** Every module specifier a file imports, type-only imports left out. */
function specifiersIn(file: string): ReadonlyArray<string> {
  const source = readFileSync(file, "utf8").replace(TYPE_ONLY_IMPORT, "");
  return Array.from(source.matchAll(SPECIFIER), (m) => m[1] ?? m[2] ?? m[3]);
}

/** The project file a specifier names, or undefined for anything else. */
function localFileFor(specifier: string, from: string): string | undefined {
  const base = specifier.startsWith("@/")
    ? path.join(SRC, specifier.slice(2))
    : specifier.startsWith(".")
      ? path.resolve(path.dirname(from), specifier)
      : undefined;
  if (base === undefined) {
    return undefined;
  }
  return [base, ...EXTENSIONS.map((ext) => base + ext)].find(isFile);
}

function isFile(candidate: string): boolean {
  return existsSync(candidate) && statSync(candidate).isFile();
}

function isNodeBuiltin(specifier: string): boolean {
  return specifier.startsWith("node:") || builtinModules.includes(specifier);
}

/**
 * Every Node built-in reachable from `entry`, each with the file that
 * imports it, in first-seen order.
 */
function nodeBuiltinsReachableFrom(
  entry: string,
  seen: ReadonlySet<string> = new Set(),
): ReadonlyArray<string> {
  if (seen.has(entry)) {
    return [];
  }
  const seenNow = new Set(seen).add(entry);
  return specifiersIn(entry).flatMap((specifier) => {
    if (isNodeBuiltin(specifier)) {
      const file = path.relative(SRC, entry).split(path.sep).join("/");
      return [`${file} imports ${specifier}`];
    }
    const file = localFileFor(specifier, entry);
    return file === undefined ? [] : nodeBuiltinsReachableFrom(file, seenNow);
  });
}

describe("the startup check's import graph", () => {
  test("reaches no Node built-in, so the Edge compile of instrumentation.ts is clean", () => {
    expect(nodeBuiltinsReachableFrom(ENTRY)).toEqual([]);
  });

  test("still reaches the environment checks it exists to run", () => {
    // A guard that passed because the entry imported nothing would prove
    // nothing; the check has to keep reading src/lib/env.ts.
    expect(specifiersIn(ENTRY)).toContain("@/lib/env");
  });
});
