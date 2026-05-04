#!/usr/bin/env bash
# Verify Phase 02 + 03: bundle splitting + lazy heavy deps
# Build apps/web, đo size chunks, kiểm tra heavy chunk có tách riêng không
# Usage: ./check-bundle.sh
set -u

REPO_ROOT="/Volumes/Data/SHBVN/plane.so"
WEB_DIR="${REPO_ROOT}/apps/web"
BUILD_DIR="${WEB_DIR}/build/client/assets"
OUT_DIR="$(dirname "$0")/results"
TS="$(date +%Y%m%d-%H%M%S)"
OUT="${OUT_DIR}/bundle-${TS}.md"
mkdir -p "${OUT_DIR}"

log() { echo "$@" | tee -a "${OUT}"; }

log "# Bundle verification — apps/web"
log ""
log "Generated: $(date)"
log ""

if [ ! -d "${BUILD_DIR}" ]; then
  log "⚠️  Build chưa tồn tại: ${BUILD_DIR}"
  log ""
  log "Đang build... (có thể mất 1-3 phút)"
  cd "${REPO_ROOT}" && pnpm --filter web build 2>&1 | tail -30 | tee -a "${OUT}"
fi

if [ ! -d "${BUILD_DIR}" ]; then
  log "❌ Build thất bại"
  exit 1
fi

log ""
log "## Top 20 chunks lớn nhất (raw size)"
log '```'
ls -lhS "${BUILD_DIR}" | head -21 | awk '{ print $5, $9 }' | tee -a "${OUT}"
log '```'

log ""
log "## Top 20 chunks lớn nhất (gzip ước lượng)"
log '```'
for f in $(ls -S "${BUILD_DIR}"/*.js 2>/dev/null | head -20); do
  raw=$(wc -c < "$f")
  gz=$(gzip -c "$f" | wc -c)
  printf "%10d  %10d  %s\n" "$raw" "$gz" "$(basename "$f")"
done | sort -rn | tee -a "${OUT}"
log '```'
log ""
log "Cột: raw_bytes  gzip_bytes  filename"

log ""
log "## Tổng kích thước"
TOTAL_RAW=$(du -sb "${BUILD_DIR}" 2>/dev/null | awk '{print $1}' || du -sk "${BUILD_DIR}" | awk '{print $1*1024}')
TOTAL_JS_RAW=$(cat "${BUILD_DIR}"/*.js 2>/dev/null | wc -c)
TOTAL_JS_GZ=$(cat "${BUILD_DIR}"/*.js 2>/dev/null | gzip -c | wc -c)
log "- Tổng assets/: $(numfmt --to=iec ${TOTAL_RAW} 2>/dev/null || echo ${TOTAL_RAW})B"
log "- Tổng JS raw: $(numfmt --to=iec ${TOTAL_JS_RAW} 2>/dev/null || echo ${TOTAL_JS_RAW})B"
log "- Tổng JS gzip: $(numfmt --to=iec ${TOTAL_JS_GZ} 2>/dev/null || echo ${TOTAL_JS_GZ})B"

log ""
log "## Heavy deps split check (Phase 02)"
declare -a CHECKS=(
  "react-vendor:react"
  "mobx-vendor:mobx"
  "dnd-vendor:atlaskit|pragmatic-drag"
  "charts-vendor:recharts"
  "pdf-vendor:react-pdf|@react-pdf"
  "xlsx-vendor:xlsx"
  "emoji-vendor:emoji-picker"
  "editor-vendor:plane.*editor|tiptap|prosemirror"
  "grid-vendor:react-grid-layout"
)
for entry in "${CHECKS[@]}"; do
  name="${entry%%:*}"; pat="${entry##*:}"
  if ls "${BUILD_DIR}"/${name}-*.js 2>/dev/null | head -1 >/dev/null; then
    f=$(ls -S "${BUILD_DIR}"/${name}-*.js | head -1)
    sz=$(wc -c < "$f")
    log "- ✅ ${name}: $(basename "$f") — $(numfmt --to=iec ${sz} 2>/dev/null || echo ${sz})B"
  else
    log "- ⚠️  ${name}: chunk không tồn tại (chưa cấu hình manualChunks hoặc tên khác)"
  fi
done

log ""
log "## Heavy deps lazy check (Phase 03)"
log "Check entry chunk KHÔNG inline xlsx/recharts/pdf"
ENTRY=$(ls -S "${BUILD_DIR}"/entry.client-*.js "${BUILD_DIR}"/root-*.js "${BUILD_DIR}"/index-*.js 2>/dev/null | head -1)
if [ -n "${ENTRY}" ]; then
  log "Entry: \`$(basename "${ENTRY}")\` — $(numfmt --to=iec $(wc -c < "${ENTRY}") 2>/dev/null)B"
  for needle in "XLSX" "@react-pdf" "recharts" "EmojiPicker"; do
    if grep -lq "${needle}" "${ENTRY}" 2>/dev/null; then
      log "- ❌ entry chứa \`${needle}\` (chưa lazy)"
    else
      log "- ✅ entry không chứa \`${needle}\`"
    fi
  done
else
  log "⚠️  Không tìm thấy entry chunk"
fi

log ""
echo "Report: ${OUT}"
