#!/bin/bash
set -e

REPORT_DIR="license-reports"
mkdir -p "$REPORT_DIR"

echo "Generating license reports..."

# Node licenses
echo "Scanning Node.js packages..."
echo "Scanning monorepo apps (web, admin, space, api, live)..."
TEMP_LICENSES=$(mktemp)
REPO_ROOT=$(pwd)

# Scan root
npx --yes license-checker --production --json --start . >> "$TEMP_LICENSES" 2>/dev/null || true

# Scan each app directory
for app_dir in apps/web apps/admin apps/space apps/api apps/live; do
  if [ -f "$app_dir/package.json" ]; then
    echo "  Scanning $app_dir..."
    cd "$app_dir"
    npx --yes license-checker --production --json >> "$TEMP_LICENSES" 2>/dev/null || true
    cd "$REPO_ROOT"
  fi
done

# Merge all results (keep unique packages, prefer non-root entries)
if [ -s "$TEMP_LICENSES" ]; then
  if command -v jq &> /dev/null; then
    # Merge JSON objects, keeping all unique keys
    jq -s 'add' "$TEMP_LICENSES" > "$REPORT_DIR/node-licenses.json" 2>/dev/null || {
      # Fallback if jq merge fails
      cat "$TEMP_LICENSES" > "$REPORT_DIR/node-licenses.json"
    }
  else
    cat "$TEMP_LICENSES" > "$REPORT_DIR/node-licenses.json"
  fi
else
  echo "Warning: No packages found. Install dependencies with: pnpm install"
  echo "{}" > "$REPORT_DIR/node-licenses.json"
fi

rm -f "$TEMP_LICENSES"

# Python licenses
echo "Scanning Python packages..."
PYTHON_REPORT="$REPORT_DIR/python-licenses.json"
cd apps/api
if command -v pip-licenses &> /dev/null; then
  pip-licenses --format=json --output-file="../../$PYTHON_REPORT" 2>/dev/null || {
    echo "Warning: pip-licenses failed. Install with: pip install pip-licenses"
    echo "[]" > "../../$PYTHON_REPORT"
  }
else
  echo "Warning: pip-licenses not found. Install with: pip install pip-licenses"
  echo "[]" > "../../$PYTHON_REPORT"
fi
cd ../..

# Generate summary
if command -v jq &> /dev/null; then
  cat > "$REPORT_DIR/summary.json" <<EOF
{
  "scanDate": "$(date -Iseconds)",
  "nodePackages": $(jq 'length' "$REPORT_DIR/node-licenses.json" 2>/dev/null || echo 0),
  "pythonPackages": $(jq 'length' "$REPORT_DIR/python-licenses.json" 2>/dev/null || echo 0),
  "nonPermissive": {
    "node": $(jq '[.[] | select(.licenses | test("GPL|AGPL") or (.licenseFile | test("GPL|AGPL")))] | length' "$REPORT_DIR/node-licenses.json" 2>/dev/null || echo 0),
    "python": $(jq '[.[] | select(.License | test("GPL|AGPL"))] | length' "$REPORT_DIR/python-licenses.json" 2>/dev/null || echo 0)
  }
}
EOF
else
  cat > "$REPORT_DIR/summary.json" <<EOF
{
  "scanDate": "$(date -Iseconds)",
  "note": "jq not installed - install for detailed analysis"
}
EOF
fi

echo "License report generated in $REPORT_DIR/"
echo "Summary:"
cat "$REPORT_DIR/summary.json"

