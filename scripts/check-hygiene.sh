#!/usr/bin/env bash
# Budgets, shellcheck, and actionlint. Same command locally, in pre-commit, and in CI.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"
bun scripts/check-loc-budget.ts
actionlint
files=()
while IFS= read -r file; do
  files+=("$file")
done < <(git ls-files "*.sh")
if ((${#files[@]})); then
  # -x follows sourced helpers (hooks/lib.sh); disable SC1091 noise for relative sources.
  shellcheck -x -e SC1091 "${files[@]}"
fi
