#!/bin/bash
set -e

REPORT_DIR="logo-references"
mkdir -p "$REPORT_DIR"

echo "Finding all logo and brand references..."

# Find imports of logo files
echo "Finding logo imports..."
rg "plane-logo|plane-takeoff|favicon" -S --files > "$REPORT_DIR/logo-imports.txt" 2>/dev/null || {
  echo "No logo imports found" > "$REPORT_DIR/logo-imports.txt"
}

# Find in code (import statements)
echo "Finding logo references in code..."
rg "from.*assets.*logo|import.*logo|plane-logo|plane-takeoff" -S > "$REPORT_DIR/code-references.txt" 2>/dev/null || {
  echo "No code references found" > "$REPORT_DIR/code-references.txt"
}

# Find in config files
echo "Finding logo references in config files..."
rg "logo|favicon" -S --files | grep -E "\.(json|ts|tsx|html|js)$" > "$REPORT_DIR/config-references.txt" 2>/dev/null || {
  echo "No config references found" > "$REPORT_DIR/config-references.txt"
}

# List all logo files
echo "Listing all logo files..."
find . -type f \( -path "*/plane-logos/*" -o -path "*/favicon/*" -o -name "*logo*" -o -name "*plane-takeoff*" \) ! -path "*/node_modules/*" ! -path "*/.git/*" > "$REPORT_DIR/logo-files.txt" 2>/dev/null || {
  echo "No logo files found" > "$REPORT_DIR/logo-files.txt"
}

# Generate summary
cat > "$REPORT_DIR/summary.json" <<EOF
{
  "scanDate": "$(date -Iseconds)",
  "logoImports": $(wc -l < "$REPORT_DIR/logo-imports.txt" | tr -d ' '),
  "codeReferences": $(wc -l < "$REPORT_DIR/code-references.txt" | tr -d ' '),
  "configReferences": $(wc -l < "$REPORT_DIR/config-references.txt" | tr -d ' '),
  "logoFiles": $(wc -l < "$REPORT_DIR/logo-files.txt" | tr -d ' ')
}
EOF

echo "Logo reference scan complete. Reports in $REPORT_DIR/"
echo "Summary:"
cat "$REPORT_DIR/summary.json"
echo ""
echo "Key files to update for rebranding:"
echo "- apps/web/app/root.tsx (favicon imports)"
echo "- apps/web/public/site.webmanifest.json"
echo "- apps/space/app/assets/plane-logos/"
echo "- apps/web/app/assets/plane-logos/"
echo "- apps/admin/app/assets/plane-logos/"

