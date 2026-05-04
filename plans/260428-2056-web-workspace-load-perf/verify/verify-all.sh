#!/usr/bin/env bash
# Master script: chạy hết 4 verify steps, tổng hợp kết quả
# Usage:
#   PLANE_USER=... PLANE_PASS=... ./verify-all.sh [BASE_URL] [SLUG]
set -u

BASE_URL="${1:-http://localhost}"
SLUG="${2:-shinhan-bank-vn}"
DIR="$(dirname "$0")"
TS="$(date +%Y%m%d-%H%M%S)"
SUMMARY="${DIR}/results/summary-${TS}.md"
mkdir -p "${DIR}/results"

echo "# Verification summary — ${TS}" | tee "${SUMMARY}"
echo "" | tee -a "${SUMMARY}"
echo "Target: ${BASE_URL}/${SLUG}/" | tee -a "${SUMMARY}"
echo "" | tee -a "${SUMMARY}"

echo "==> [1/4] Headers (Phase 01)"
bash "${DIR}/check-headers.sh" "${BASE_URL}" || true
echo "" | tee -a "${SUMMARY}"

echo "==> [2/4] Bundle (Phase 02 + 03)"
bash "${DIR}/check-bundle.sh" || true

echo "==> [3/4] Lighthouse"
bash "${DIR}/run-lighthouse.sh" "${BASE_URL}" "${SLUG}" || true

echo "==> [4/4] Login flow (Playwright)"
if [ -n "${PLANE_USER:-}" ] && [ -n "${PLANE_PASS:-}" ]; then
  if [ ! -d "${DIR}/node_modules/playwright" ]; then
    echo "Installing playwright..."
    (cd "${DIR}" && npm init -y >/dev/null && npm install playwright >/dev/null 2>&1)
    npx --prefix "${DIR}" playwright install chromium
  fi
  node "${DIR}/measure-login-flow.mjs" "${BASE_URL}" "${SLUG}" || true
else
  echo "⏭  Bỏ qua step 4 (cần PLANE_USER + PLANE_PASS env vars)"
fi

echo ""
echo "==> Done. Tất cả kết quả ở: ${DIR}/results/"
ls -lt "${DIR}/results/" | head -10
