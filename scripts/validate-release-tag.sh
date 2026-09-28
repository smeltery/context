#!/usr/bin/env bash
# Validate RELEASE_TAG is semver and points at origin/main.
set -euo pipefail
if [[ -z "${RELEASE_TAG:-}" ]]; then
  echo "RELEASE_TAG is required" >&2
  exit 1
fi
case "$RELEASE_TAG" in
v[0-9]*.[0-9]*.[0-9]*) ;;
*)
  echo "release tag must look like vMAJOR.MINOR.PATCH" >&2
  exit 1
  ;;
esac
git fetch origin main
tag_commit="$(git rev-list -n 1 "$RELEASE_TAG")"
main_commit="$(git rev-parse origin/main)"
test "$tag_commit" = "$main_commit"
