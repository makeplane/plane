#!/bin/bash
# Fix executable permissions based on shebang presence in .claude folder
# - No shebang + executable → remove exec
# - Has shebang + not executable → add exec

set -uo pipefail

changed=0
skipped=0
target_dir="${1:-.claude}"

# Validate target exists
[[ -e "$target_dir" ]] || { echo "Error: '$target_dir' not found" >&2; exit 1; }

while IFS= read -r -d '' file; do
    [[ -L "$file" ]] && continue
    [[ ! -s "$file" ]] && continue

    # Skip binary files
    file -b --mime-encoding "$file" 2>/dev/null | grep -q binary && continue

    first_line=$(head -c 100 "$file" 2>/dev/null | head -n1) || continue

    # Strip UTF-8 BOM if present
    first_line="${first_line#$'\xef\xbb\xbf'}"

    if [[ -x "$file" ]] && [[ "$first_line" != "#!"* ]]; then
        if chmod -x "$file" 2>/dev/null; then
            echo "- exec: $file"
            git add --chmod=-x "$file" 2>/dev/null || true
            ((changed++)) || true
        else
            echo "WARN: chmod failed: $file" >&2
            ((skipped++)) || true
        fi
    elif [[ ! -x "$file" ]] && [[ "$first_line" == "#!"* ]]; then
        if chmod +x "$file" 2>/dev/null; then
            echo "+ exec: $file"
            git add --chmod=+x "$file" 2>/dev/null || true
            ((changed++)) || true
        else
            echo "WARN: chmod failed: $file" >&2
            ((skipped++)) || true
        fi
    fi
done < <(find "$target_dir" -type f -print0)

echo "✓ Fixed $changed files"
[[ $skipped -gt 0 ]] && echo "⚠ Skipped $skipped files (permission denied)"
exit 0
