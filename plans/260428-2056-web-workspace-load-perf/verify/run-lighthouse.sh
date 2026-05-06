#!/usr/bin/env bash
# Chạy Lighthouse 3 lần lấy median, output HTML + JSON
# Usage: ./run-lighthouse.sh [BASE_URL] [WORKSPACE_SLUG]
set -u

BASE_URL="${1:-http://localhost}"
SLUG="${2:-shinhan-bank-vn}"
TARGET_URL="${BASE_URL}/${SLUG}/"

OUT_DIR="$(dirname "$0")/results"
TS="$(date +%Y%m%d-%H%M%S)"
mkdir -p "${OUT_DIR}"

if ! command -v npx >/dev/null; then
  echo "❌ Cần npx (Node.js)"; exit 1
fi

echo "Lighthouse target: ${TARGET_URL}"
echo "Chạy 3 lần lấy median..."

for i in 1 2 3; do
  echo "→ Run ${i}/3"
  npx --yes lighthouse "${TARGET_URL}" \
    --preset=desktop \
    --quiet \
    --chrome-flags="--headless --no-sandbox" \
    --output=html --output=json \
    --output-path="${OUT_DIR}/lighthouse-${TS}-run${i}" \
    || echo "  ⚠️  run ${i} failed"
done

# Aggregate JSON metrics
echo ""
echo "## Median metrics"
node -e "
const fs = require('fs');
const path = require('path');
const dir = '${OUT_DIR}';
const ts = '${TS}';
const runs = [1,2,3].map(i => {
  try { return JSON.parse(fs.readFileSync(path.join(dir, \`lighthouse-\${ts}-run\${i}.report.json\`),'utf8')); }
  catch { return null; }
}).filter(Boolean);
if (!runs.length) { console.log('No runs'); process.exit(0); }
const median = arr => arr.sort((a,b)=>a-b)[Math.floor(arr.length/2)];
const metrics = ['first-contentful-paint','largest-contentful-paint','speed-index','total-blocking-time','cumulative-layout-shift','interactive'];
console.log('| Metric | Median | Score |');
console.log('|--------|-------:|------:|');
metrics.forEach(m => {
  const vals = runs.map(r => r.audits[m]?.numericValue).filter(Number.isFinite);
  const score = runs.map(r => r.audits[m]?.score).filter(Number.isFinite);
  if (vals.length) console.log(\`| \${m} | \${median(vals).toFixed(0)} | \${(median(score)*100).toFixed(0)} |\`);
});
const perf = runs.map(r => r.categories.performance.score*100);
console.log(\`\\n**Performance score (median): \${median(perf).toFixed(0)}/100**\`);
" | tee "${OUT_DIR}/lighthouse-${TS}-summary.md"

echo ""
echo "Reports: ${OUT_DIR}/lighthouse-${TS}-*"
