#!/usr/bin/env bash
# Rebuild apps/web/public/og-context.png from the brand mark + Inter.
set -euo pipefail
root="$(git rev-parse --show-toplevel)"
cd "$root"

FONT_SB="${INTER_SEMIBOLD:-$HOME/Library/Fonts/Inter-SemiBold.ttf}"
FONT_MD="${INTER_MEDIUM:-$HOME/Library/Fonts/Inter-Medium.ttf}"
FONT_RG="${INTER_REGULAR:-$HOME/Library/Fonts/Inter-Regular.ttf}"
CREATURE="apps/web/public/assets/context-creature.png"
OUT="apps/web/public/og-context.png"
WORK="$(mktemp -d -t og-context)"
trap 'rm -rf "$WORK"' EXIT

if [[ ! -f "$FONT_SB" || ! -f "$FONT_MD" || ! -f "$FONT_RG" ]]; then
  echo "error: Inter Regular/Medium/SemiBold not found (set INTER_* paths)" >&2
  exit 1
fi
command -v magick >/dev/null || { echo "error: ImageMagick (magick) required" >&2; exit 1; }

W=1200
H=630
LOGO_SIZE=220
RADIUS=49

magick -size "${W}x${H}" \
  radial-gradient:"#ffffff-#e4e4e7" \
  -gravity center -extent "${W}x${H}" \
  "$WORK/bg.png"

# Creature asset is soft-alpha gray; harden to opaque black silhouette and trim padding.
magick "$CREATURE" -alpha extract -threshold 12% \
  -background black -alpha shape \
  -trim +repage \
  "$WORK/creature.png"

# Light squircle + creature flush to the right/bottom edge. No shadow.
magick -size "${LOGO_SIZE}x${LOGO_SIZE}" xc:"#f0f0f0" \
  \( -size "${LOGO_SIZE}x${LOGO_SIZE}" xc:black -fill white \
     -draw "roundrectangle 0,0 $((LOGO_SIZE - 1)),$((LOGO_SIZE - 1)) ${RADIUS},${RADIUS}" \) \
  -alpha off -compose CopyOpacity -composite \
  \( "$WORK/creature.png" -resize x250 \) \
  -gravity southeast -geometry -12-4 -compose over -composite \
  "$WORK/logo.png"

# Clip creature overflow to the squircle.
magick "$WORK/logo.png" \
  \( -size "${LOGO_SIZE}x${LOGO_SIZE}" xc:black -fill white \
     -draw "roundrectangle 0,0 $((LOGO_SIZE - 1)),$((LOGO_SIZE - 1)) ${RADIUS},${RADIUS}" \) \
  -alpha off -compose CopyOpacity -composite \
  "$WORK/logo.png"

CLUSTER_W=$((LOGO_SIZE + 48 + 440))
CLUSTER_LEFT=$(( (W - CLUSTER_W) / 2 ))
CLUSTER_TOP=$(( (H - LOGO_SIZE) / 2 ))
LOGO_X=$CLUSTER_LEFT
LOGO_Y=$CLUSTER_TOP
TEXT_X=$((CLUSTER_LEFT + LOGO_SIZE + 48))
TITLE_Y=$((CLUSTER_TOP + 82))
TAG_Y=$((CLUSTER_TOP + 132))

magick "$WORK/bg.png" \
  "$WORK/logo.png" -geometry "+${LOGO_X}+${LOGO_Y}" -compose over -composite \
  "$WORK/base.png"

magick "$WORK/base.png" \
  -font "$FONT_SB" -fill "#111111" -pointsize 22 \
  -gravity northwest -annotate +56+48 "Apps & links" \
  -font "$FONT_RG" -fill "#6b6b6b" -pointsize 17 \
  -annotate +56+76 "Twelve things, one glance away" \
  \
  -font "$FONT_SB" -fill "#111111" -pointsize 22 \
  -gravity northeast -annotate +56+48 "Live widgets" \
  -font "$FONT_RG" -fill "#6b6b6b" -pointsize 17 \
  -annotate +56+76 "Weather, music, stats & AI" \
  \
  -font "$FONT_SB" -fill "#111111" -pointsize 22 \
  -gravity southwest -annotate +56+76 "Clipboard history" \
  -font "$FONT_RG" -fill "#6b6b6b" -pointsize 17 \
  -annotate +56+48 "Search, preview, paste again" \
  \
  -font "$FONT_SB" -fill "#111111" -pointsize 22 \
  -gravity southeast -annotate +56+76 "Free for Mac" \
  -font "$FONT_RG" -fill "#6b6b6b" -pointsize 17 \
  -annotate +56+48 "Open source · macOS 15+" \
  \
  -gravity northwest \
  -font "$FONT_SB" -fill "#111111" -pointsize 56 \
  -annotate "+${TEXT_X}+${TITLE_Y}" "Context" \
  -font "$FONT_MD" -fill "#6b6b6b" -pointsize 22 \
  -annotate "+${TEXT_X}+${TAG_Y}" "A second dock for your Mac" \
  PNG32:"$OUT"

echo "wrote $OUT"
