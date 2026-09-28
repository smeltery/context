#!/usr/bin/env bun
/**
 * Unified LOC gate: per-file line budgets + flat-directory file counts.
 * Config: scripts/loc-budget.json (also mirrors file-size / flat-directory JSON).
 */
import { $ } from "bun";
import { dirname } from "node:path";
import { readFileSync } from "node:fs";

const repoRoot = (await $`git rev-parse --show-toplevel`.text()).trim();
process.chdir(repoRoot);

const budgetPath = Bun.argv[2] ?? "scripts/loc-budget.json";
const budgets = JSON.parse(readFileSync(budgetPath, "utf8")) as {
  default_lines: number;
  files: Record<string, number>;
  default_files: number;
  directories: Record<string, { limit: number; reason?: string }>;
};

const tracked = (await $`git ls-files`.text()).split("\n").filter(Boolean);
const lineSuffix =
  /\.(ts|tsx|js|mjs|cjs|md|mdx|css|json|toml|ya?ml|swift|sh)$/;
const lineExcluded = /(^bun\.lock$)/;
const dirSkip =
  /(^|\/)(node_modules|target|dist|build|deps|_build|site|fixtures|vendor|\.build)(\/|$)/;

let fail = false;
let checked = 0;

for (const file of tracked) {
  if (!lineSuffix.test(file) || lineExcluded.test(file)) continue;
  const path = `${repoRoot}/${file}`;
  if (!(await Bun.file(path).exists())) continue;
  checked += 1;
  const lines = (await Bun.file(path).text()).split("\n").length;
  const budget = budgets.files[file] ?? budgets.default_lines;
  if (lines > budget) {
    console.log(`FAIL: ${file}: ${lines} lines > budget ${budget}`);
    fail = true;
  }
}

const counts = new Map<string, number>();
for (const file of tracked) {
  if (dirSkip.test(file)) continue;
  const dir = dirname(file);
  counts.set(dir, (counts.get(dir) ?? 0) + 1);
}

for (const [dir, count] of [...counts.entries()].sort()) {
  const budget = budgets.directories[dir]?.limit ?? budgets.default_files;
  if (count > budget) {
    console.log(`FAIL: ${dir}: ${count} files > budget ${budget}`);
    fail = true;
  }
}

if (fail) {
  console.error(
    `loc budget check failed (checked ${checked} files, default ${budgets.default_lines} lines / ${budgets.default_files} files/dir)`,
  );
  process.exit(1);
}

console.log(
  `loc budget check passed (${checked} files, default ${budgets.default_lines} lines / ${budgets.default_files} files/dir)`,
);
