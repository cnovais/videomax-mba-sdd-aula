#!/usr/bin/env bash
# On-demand generator for an oversized (>2GB) video fixture used to
# manually exercise F03's "Files above 2GB are rejected before transfer"
# behavior (UI-UPLOAD-03 in docs/F03-video-upload/contract.md).
#
# The automated UI-UPLOAD-03 item fakes a large File.size in-browser, so
# no committed fixture is required for CI/evaluator runs. This script is
# for real, manual verification only (dragging an actual oversized file
# into the drop zone) — its output must never be committed (see
# .gitignore's "video-samples/oversized*" entry) and is not part of any
# contract's Static Inputs declaration.
#
# Uses dd to allocate the padding bytes (real, non-sparse) so the file
# behaves identically to a real oversized upload on every filesystem.
set -euo pipefail

_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$_DIR/video-samples/oversized.mp4"
SIZE_MB=2200                      # > 2048 MiB (2GB), comfortably over the limit
HEADER="$_DIR/video-samples/tiny-valid.mp4"

for arg in "$@"; do
    case "$arg" in
        --size-mb=*) SIZE_MB="${arg#*=}" ;;
        --out=*)     OUT="${arg#*=}" ;;
        *) echo "[generate-oversized-video] unknown flag: $arg" >&2; exit 1 ;;
    esac
done

[ -f "$HEADER" ] || { echo "[generate-oversized-video] missing $HEADER — generate the F03 fixtures first." >&2; exit 1; }

HEADER_BYTES=$(wc -c < "$HEADER" | tr -d ' ')
HEADER_MB_CEIL=$(( (HEADER_BYTES + 1048575) / 1048576 ))
PAD_MB=$(( SIZE_MB - HEADER_MB_CEIL ))
[ "$PAD_MB" -gt 0 ] || { echo "[generate-oversized-video] --size-mb=$SIZE_MB is too small relative to the header file ($HEADER_BYTES bytes)." >&2; exit 1; }

mkdir -p "$(dirname "$OUT")"

echo "[generate-oversized-video] writing valid MP4 header ($HEADER_BYTES bytes) ..."
cp "$HEADER" "$OUT"

echo "[generate-oversized-video] padding with ${PAD_MB}MB of zero bytes via dd ..."
dd if=/dev/zero bs=1M count="$PAD_MB" >> "$OUT" 2>/dev/null

FINAL_BYTES=$(wc -c < "$OUT" | tr -d ' ')
echo "[generate-oversized-video] done: $OUT ($FINAL_BYTES bytes, ~$((FINAL_BYTES / 1048576))MB)"
echo "[generate-oversized-video] reminder: this file must never be committed (see .gitignore)."
