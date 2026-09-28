#!/usr/bin/env bash
# Markdown and Mermaid checks. Same command locally, in pre-commit, and in CI.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"
bun install --frozen-lockfile
bun scripts/check-markdown.ts
bun scripts/check-mermaid.ts
bun scripts/check-doc-links.ts
