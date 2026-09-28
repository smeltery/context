#!/usr/bin/env bash
# Build macOS release artifacts into dist-release/.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"
version="${RELEASE_TAG#v}"
mkdir -p dist-release
(
  cd macos
  swift build -c release --product Context
)
bin="$(find macos/.build -type f -name Context -perm -111 | head -1)"
test -n "$bin"
test -f "$bin"
cp "$bin" "dist-release/context-macos-arm64"
bun install --frozen-lockfile
bun run build
tar -C apps/web/dist -czf "dist-release/context-web-${version}.tar.gz" .
(
  cd dist-release
  shasum -a 256 context-macos-arm64 "context-web-${version}.tar.gz" > SHA256SUMS
)
ls -la dist-release
