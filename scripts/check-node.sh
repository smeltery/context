#!/usr/bin/env bash
# Lint/tests/build for the TypeScript workspace.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"
bun install --frozen-lockfile
bun test packages/core
bun run build
