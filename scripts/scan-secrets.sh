#!/bin/bash
set -e

REPORT_DIR="secret-reports"
mkdir -p "$REPORT_DIR"

echo "Scanning for secrets and sensitive data..."

# Check if gitleaks is installed
if command -v gitleaks &> /dev/null; then
  echo "Running gitleaks scan..."
  gitleaks detect --source . --report-path "$REPORT_DIR/gitleaks-report.json" --verbose 2>/dev/null || {
    echo "Warning: gitleaks scan completed with findings or errors"
  }
else
  echo "Warning: gitleaks not installed. Install from: https://github.com/gitleaks/gitleaks"
  echo "[]" > "$REPORT_DIR/gitleaks-report.json"
fi

# Manual pattern scanning
echo "Scanning for common secret patterns..."
rg "API_KEY|APIKEY|SECRET|SENTRY_DSN|GTM-|UA-|G-[A-Z0-9]{10,}|ACCESS_TOKEN|PRIVATE_KEY" -S --files > "$REPORT_DIR/secret-patterns.txt" 2>/dev/null || {
  echo "No secret patterns found" > "$REPORT_DIR/secret-patterns.txt"
}

# Check env files for long values (potential secrets)
echo "Checking .env files for potential secrets..."
rg "=.*[A-Za-z0-9]{32,}" --files | grep -E "\.(env|config)$" > "$REPORT_DIR/env-secrets.txt" 2>/dev/null || {
  echo "No .env files with long values found" > "$REPORT_DIR/env-secrets.txt"
}

# Generate summary
if command -v jq &> /dev/null && [ -f "$REPORT_DIR/gitleaks-report.json" ]; then
  cat > "$REPORT_DIR/summary.json" <<EOF
{
  "scanDate": "$(date -Iseconds)",
  "gitleaksFindings": $(jq 'length' "$REPORT_DIR/gitleaks-report.json" 2>/dev/null || echo 0),
  "patternMatches": $(wc -l < "$REPORT_DIR/secret-patterns.txt" | tr -d ' '),
  "envFileMatches": $(wc -l < "$REPORT_DIR/env-secrets.txt" | tr -d ' ')
}
EOF
else
  cat > "$REPORT_DIR/summary.json" <<EOF
{
  "scanDate": "$(date -Iseconds)",
  "note": "jq not installed or gitleaks report missing - install for detailed analysis"
}
EOF
fi

echo "Secret scan complete. Reports in $REPORT_DIR/"
echo "Summary:"
cat "$REPORT_DIR/summary.json"

if [ -f "$REPORT_DIR/gitleaks-report.json" ] && command -v jq &> /dev/null; then
  FINDINGS=$(jq 'length' "$REPORT_DIR/gitleaks-report.json" 2>/dev/null || echo 0)
  if [ "$FINDINGS" -gt 0 ]; then
    echo ""
    echo "⚠️  WARNING: $FINDINGS potential secrets found!"
    echo "Review $REPORT_DIR/gitleaks-report.json for details"
  fi
fi

