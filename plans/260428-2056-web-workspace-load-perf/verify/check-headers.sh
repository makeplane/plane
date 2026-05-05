#!/usr/bin/env bash
# Verify Phase 01: nén (gzip/zstd/br) + Cache-Control headers
# Usage: ./check-headers.sh [BASE_URL]
#   default BASE_URL=http://localhost
set -u

BASE_URL="${1:-http://localhost}"
OUT_DIR="$(dirname "$0")/results"
TS="$(date +%Y%m%d-%H%M%S)"
OUT="${OUT_DIR}/headers-${TS}.md"
mkdir -p "${OUT_DIR}"

pass=0; fail=0
log() { echo "$@" | tee -a "${OUT}"; }
check() {
  local name="$1"; local expect_pattern="$2"; local actual="$3"
  if echo "${actual}" | grep -qiE "${expect_pattern}"; then
    log "- ✅ ${name}: \`$(echo "${actual}" | tr -d '\r' | head -c 120)\`"
    pass=$((pass+1))
  else
    log "- ❌ ${name}: expected \`${expect_pattern}\`, got \`$(echo "${actual}" | tr -d '\r' | head -c 120)\`"
    fail=$((fail+1))
  fi
}

log "# Headers verification — ${BASE_URL}"
log ""
log "Generated: $(date)"
log ""

# 1. Lấy index.html, tìm asset đầu tiên trong /assets/
log "## 1. Probe index.html"
INDEX_HEADERS=$(curl -sI -H "Accept-Encoding: gzip, br, zstd" "${BASE_URL}/" 2>&1)
INDEX_BODY=$(curl -s -H "Accept-Encoding: gzip, br, zstd" "${BASE_URL}/" 2>&1)
log '```'
log "${INDEX_HEADERS}"
log '```'

ASSET=$(echo "${INDEX_BODY}" | grep -oE '/assets/[a-zA-Z0-9._-]+\.(js|css)' | head -1)
if [ -z "${ASSET}" ]; then
  log ""
  log "⚠️  Không tìm thấy /assets/*.{js,css} trong index.html — kiểm tra build thủ công"
else
  log ""
  log "Asset mẫu: \`${ASSET}\`"
fi
log ""

# 2. Check index.html headers
log "## 2. index.html (no-cache expected)"
check "Cache-Control no-cache" "no-cache|no-store|max-age=0" "$(echo "${INDEX_HEADERS}" | grep -i '^cache-control')"
log ""

# 3. Check asset headers
if [ -n "${ASSET}" ]; then
  log "## 3. ${ASSET} (immutable + encoded expected)"
  ASSET_HEADERS=$(curl -sI -H "Accept-Encoding: gzip, br, zstd" "${BASE_URL}${ASSET}" 2>&1)
  log '```'
  log "${ASSET_HEADERS}"
  log '```'
  check "Cache-Control immutable" "immutable" "$(echo "${ASSET_HEADERS}" | grep -i '^cache-control')"
  check "Content-Encoding (gzip/br/zstd)" "gzip|br|zstd" "$(echo "${ASSET_HEADERS}" | grep -i '^content-encoding')"
  check "max-age >= 1 năm" "max-age=(31536000|[0-9]{8,})" "$(echo "${ASSET_HEADERS}" | grep -i '^cache-control')"

  # Compare raw vs encoded size
  RAW=$(curl -s "${BASE_URL}${ASSET}" -o /tmp/_raw.bin -w "%{size_download}")
  ENC=$(curl -s -H "Accept-Encoding: gzip, br, zstd" "${BASE_URL}${ASSET}" -o /tmp/_enc.bin -w "%{size_download}")
  if [ "${RAW}" -gt 0 ] && [ "${ENC}" -gt 0 ]; then
    RATIO=$(awk "BEGIN { printf \"%.2f\", ${RAW}/${ENC} }")
    log ""
    log "**Compression ratio**: raw=${RAW}B, encoded=${ENC}B → **${RATIO}×**"
    if awk "BEGIN { exit !(${RATIO} >= 2.5) }"; then
      log "- ✅ ratio ≥ 2.5× (đạt)"
      pass=$((pass+1))
    else
      log "- ❌ ratio < 2.5× (chưa nén tốt)"
      fail=$((fail+1))
    fi
  fi
fi

log ""
log "## Summary"
log "- Passed: **${pass}**"
log "- Failed: **${fail}**"
log ""
echo ""
echo "Report: ${OUT}"
exit ${fail}
