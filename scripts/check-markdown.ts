#!/usr/bin/env bun
import { Glob } from "bun";
import { resolve } from "node:path";
import { lint } from "markdownlint/sync";

const repoRoot = resolve(import.meta.dir, "..");

const files: string[] = [];
const glob = new Glob("**/*.md");
for await (const file of glob.scan({ cwd: repoRoot, onlyFiles: true })) {
  if (
    file.includes("node_modules/") ||
    file.includes("/dist/") ||
    file.includes("macos/.build/") ||
    file.startsWith("vendor/")
  ) {
    continue;
  }
  files.push(`${repoRoot}/${file}`);
}

if (files.length === 0) {
  console.error("markdownlint: no markdown files found");
  process.exit(1);
}

const result = lint({
  files,
  config: {
    default: true,
    MD010: false,
    MD013: false,
    MD014: false,
    MD024: false,
    MD033: false,
    MD040: false,
    MD041: false,
    MD051: false,
    MD060: false,
  },
});

let fail = false;
for (const [file, findings] of Object.entries(result)) {
  if (!findings?.length) continue;
  fail = true;
  const rel = file.startsWith(`${repoRoot}/`)
    ? file.slice(repoRoot.length + 1)
    : file;
  for (const finding of findings) {
    console.error(
      `${rel}:${finding.lineNumber} ${finding.ruleNames.join("/")} ${finding.ruleDescription}`,
    );
  }
}

if (fail) process.exit(1);
console.log(`markdownlint passed (${files.length} files)`);
