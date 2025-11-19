#!/bin/bash
set -e

REPORT_DIR="asset-reports"
mkdir -p "$REPORT_DIR"

echo "Scanning assets..."

# Find all font/image files
echo "Finding all asset files..."
rg "\.(ttf|woff|woff2|otf|eot|png|jpg|jpeg|svg|gif|webp|ico)$" --files | sort > "$REPORT_DIR/assets-list.txt" 2>/dev/null || {
  find . -type f \( -name "*.ttf" -o -name "*.woff" -o -name "*.woff2" -o -name "*.otf" -o -name "*.eot" -o -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.svg" -o -name "*.gif" -o -name "*.webp" -o -name "*.ico" \) | sort > "$REPORT_DIR/assets-list.txt"
}

# Check for proprietary fonts (common names)
echo "Checking for proprietary fonts..."
rg -i "helvetica|arial|times|courier|verdana|trebuchet" --files > "$REPORT_DIR/proprietary-fonts.txt" 2>/dev/null || echo "No proprietary font references found" > "$REPORT_DIR/proprietary-fonts.txt"

# Find logo/brand references
echo "Finding logo/brand references..."
rg -i "logo|brand|plane|favicon" --files | grep -E "\.(tsx?|jsx?|json|css|svg|png)$" > "$REPORT_DIR/brand-references.txt" 2>/dev/null || echo "No brand references found" > "$REPORT_DIR/brand-references.txt"

# Check file sizes (large binaries may be proprietary)
echo "Checking file sizes..."
find . -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.woff*" \) -exec ls -lh {} \; 2>/dev/null | awk '{print $5, $9}' | sort -h > "$REPORT_DIR/file-sizes.txt" || echo "No files found" > "$REPORT_DIR/file-sizes.txt"

# Generate summary
cat > "$REPORT_DIR/summary.json" <<EOF
{
  "scanDate": "$(date -Iseconds)",
  "totalAssets": $(wc -l < "$REPORT_DIR/assets-list.txt" | tr -d ' '),
  "proprietaryFontReferences": $(wc -l < "$REPORT_DIR/proprietary-fonts.txt" | tr -d ' '),
  "brandReferences": $(wc -l < "$REPORT_DIR/brand-references.txt" | tr -d ' ')
}
EOF

echo "Asset scan complete. Reports in $REPORT_DIR/"
echo "Summary:"
cat "$REPORT_DIR/summary.json"

