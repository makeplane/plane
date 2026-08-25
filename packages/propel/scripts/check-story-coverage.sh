#!/usr/bin/env bash
# Checks that every component directory in packages/propel/src/ has a .stories.tsx file.
# In CI: fails only for directories that are NEW in the current PR (--new-only flag).
# Locally: reports all gaps.
#
# Usage:
#   ./check-story-coverage.sh           # report all missing stories
#   ./check-story-coverage.sh --new-only # fail only on newly added dirs (CI mode)

set -eo pipefail

PROPEL_SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/src"
NEW_ONLY=false
[[ "${1:-}" == "--new-only" ]] && NEW_ONLY=true

# Directories that intentionally have no story
SKIP_DIRS=("utils" "styles" "icons")

is_skipped() {
  local name="$1"
  for skip in "${SKIP_DIRS[@]}"; do
    [[ "$name" == "$skip" ]] && return 0
  done
  return 1
}

# When --new-only: collect dirs added by this PR vs. base branch
new_dirs=()
if [[ "$NEW_ONLY" == true ]]; then
  base_sha="${GITHUB_BASE_SHA:-$(git merge-base HEAD origin/preview 2>/dev/null || echo "")}"
  if [[ -n "$base_sha" ]]; then
    while IFS= read -r dir_name; do
      old_count=$(git ls-tree -r "$base_sha" -- "packages/propel/src/$dir_name/" 2>/dev/null | wc -l | tr -d ' ')
      [[ "$old_count" -eq 0 ]] && new_dirs+=("$dir_name")
    done < <(git diff --name-only --diff-filter=A "$base_sha" HEAD -- "packages/propel/src/" 2>/dev/null |
      sed -E 's|packages/propel/src/([^/]+)/.*|\1|' | sort -u)
    # deduplicate
    if [[ ${#new_dirs[@]} -gt 0 ]]; then
      mapfile -t new_dirs < <(printf '%s\n' "${new_dirs[@]}" | sort -u)
    fi
  fi
fi

missing=(); all_dirs=()

while IFS= read -r dir; do
  name=$(basename "$dir")
  is_skipped "$name" && continue

  tsx_files=$(find "$dir" -maxdepth 2 -name "*.tsx" ! -name "*.stories.tsx" 2>/dev/null | wc -l | tr -d ' ')
  [[ "$tsx_files" -eq 0 ]] && continue

  all_dirs+=("$name")

  story_files=$(find "$dir" -maxdepth 2 -name "*.stories.tsx" 2>/dev/null | wc -l | tr -d ' ')
  [[ "$story_files" -eq 0 ]] && missing+=("$name")
done < <(find "$PROPEL_SRC" -mindepth 1 -maxdepth 1 -type d | sort)

# In --new-only mode, restrict failures to newly added dirs
failing=()
if [[ "$NEW_ONLY" == true ]]; then
  for name in "${missing[@]}"; do
    for new in "${new_dirs[@]}"; do
      [[ "$name" == "$new" ]] && failing+=("$name") && break
    done
  done
else
  failing=("${missing[@]}")
fi

total=${#all_dirs[@]}
covered=$(( total - ${#missing[@]} ))

echo ""
echo "━━━ Propel Story Coverage ━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Components : $total"
echo "  With story : $covered"
echo "  Missing    : ${#missing[@]}"
echo "  Coverage   : $(( total > 0 ? covered * 100 / total : 0 ))%"
echo ""

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "⚠️  Components without stories:"
  for name in "${missing[@]}"; do
    echo "    - $name"
  done
  echo ""
fi

if [[ ${#failing[@]} -gt 0 ]]; then
  echo "❌ New components added in this PR are missing stories:"
  for name in "${failing[@]}"; do
    echo "    - packages/propel/src/$name/"
  done
  echo ""
  echo "  Add a <component>.stories.tsx file before merging."
  exit 1
fi

echo "✅ No new coverage gaps introduced by this PR."
