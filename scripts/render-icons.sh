#!/usr/bin/env bash
# Rebuild all bitmap brand assets from the canonical SVG.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
command -v magick >/dev/null || { echo "error: ImageMagick (magick) required" >&2; exit 1; }
command -v rsvg-convert >/dev/null || { echo "error: librsvg (rsvg-convert) required" >&2; exit 1; }
public="apps/web/public"
for size in 16 32 48 64 180 512; do
  name="icon-$size"
  if (( size <= 48 )); then name="favicon-$size"; fi
  rsvg-convert --width "$size" --height "$size" "$public/icon.svg" --output "$public/$name.png"
done
magick "$public/favicon-16.png" "$public/favicon-32.png" "$public/favicon-48.png" "$public/favicon.ico"
cp "$public/icon-512.png" "$public/assets/context-icon.png"
