#!/bin/bash
# Custom Claude Code statusline for Bash
# Cross-platform support: macOS, Linux
# Theme: detailed | Features: directory, git, model, usage, session, tokens
#
# Context Window Calculation:
# - 100% = compaction threshold (not model limit)
# - Self-calibrates via PreCompact hook
# - Falls back to smart defaults based on window size

input=$(cat)

# Calibration file path (now in /tmp/ck/ namespace - fixes #178)
CALIBRATION_PATH="${TMPDIR:-/tmp}/ck/calibration.json"

# ---- time helpers ----
to_epoch() {
  ts="$1"
  if command -v gdate >/dev/null 2>&1; then gdate -d "$ts" +%s 2>/dev/null && return; fi
  date -u -j -f "%Y-%m-%dT%H:%M:%S%z" "${ts/Z/+0000}" +%s 2>/dev/null && return
  python3 - "$ts" <<'PY' 2>/dev/null
import sys, datetime
s=sys.argv[1].replace('Z','+00:00')
print(int(datetime.datetime.fromisoformat(s).timestamp()))
PY
}

fmt_time_hm() {
  epoch="$1"
  if date -r 0 +%s >/dev/null 2>&1; then date -r "$epoch" +"%H:%M"; else date -d "@$epoch" +"%H:%M"; fi
}

# ---- compact threshold calculation ----
# Get smart default compact threshold based on context window size
# Research-based defaults:
# - 200k window: ~80% (160k) - confirmed from GitHub issues
# - 500k window: ~60% (300k) - estimated
# - 1M window: ~33% (330k) - derived from user observations
get_default_compact_threshold() {
  local context_size="$1"

  # Known thresholds (autocompact buffer = 22.5% for 200k)
  case "$context_size" in
    200000) echo 155000; return ;;  # 77.5% - confirmed via /context
    1000000) echo 330000; return ;; # 33% - 1M beta window
  esac

  # Tiered defaults based on window size
  if [ "$context_size" -ge 1000000 ] 2>/dev/null; then
    echo $((context_size * 33 / 100))
  else
    # Default: ~77.5% for standard windows (200k confirmed)
    echo $((context_size * 775 / 1000))
  fi
}

# Read calibrated threshold from file if available
get_compact_threshold() {
  local context_size="$1"

  # Try to read calibration file
  if [ -f "$CALIBRATION_PATH" ] && command -v jq >/dev/null 2>&1; then
    local calibrated
    calibrated=$(jq -r --arg key "$context_size" '.[$key].threshold // empty' "$CALIBRATION_PATH" 2>/dev/null)
    if [ -n "$calibrated" ] && [ "$calibrated" -gt 0 ] 2>/dev/null; then
      echo "$calibrated"
      return
    fi
  fi

  # Fall back to smart defaults
  get_default_compact_threshold "$context_size"
}

# ---- progress bar ----
progress_bar() {
  pct="${1:-0}"; width="${2:-12}"
  [[ "$pct" =~ ^[0-9]+$ ]] || pct=0; ((pct<0))&&pct=0; ((pct>100))&&pct=100
  filled=$(( pct * width / 100 )); empty=$(( width - filled ))
  # ▰ (U+25B0) filled, ▱ (U+25B1) empty - smooth horizontal rectangles
  for ((i=0; i<filled; i++)); do printf '▰'; done
  for ((i=0; i<empty; i++)); do printf '▱'; done
}

# ---- severity emoji (no colors) ----
get_severity_emoji() {
  local pct="$1"
  if [ "$pct" -ge 90 ] 2>/dev/null; then
    echo "🔴"      # Critical
  elif [ "$pct" -ge 70 ] 2>/dev/null; then
    echo "🟡"      # Warning
  else
    echo "🟢"      # Healthy
  fi
}

# git utilities
num_or_zero() { v="$1"; [[ "$v" =~ ^[0-9]+$ ]] && echo "$v" || echo 0; }

# ---- git (detect early for fallback mode) ----
git_branch=""
if git rev-parse --git-dir >/dev/null 2>&1; then
  git_branch=$(git branch --show-current 2>/dev/null || git rev-parse --short HEAD 2>/dev/null)
fi

# ---- basics ----
if command -v jq >/dev/null 2>&1; then
  current_dir=$(echo "$input" | jq -r '.workspace.current_dir // .cwd // "unknown"' 2>/dev/null | sed "s|^$HOME|~|g")
  model_name=$(echo "$input" | jq -r '.model.display_name // "Claude"' 2>/dev/null)
  model_version=$(echo "$input" | jq -r '.model.version // ""' 2>/dev/null)
else
  # Fallback: Extract basic info without jq using grep/sed
  current_dir=$(echo "$input" | grep -o '"current_dir"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*:.*"\([^"]*\)".*/\1/' | sed "s|^$HOME|~|g")
  [ -z "$current_dir" ] && current_dir=$(pwd | sed "s|^$HOME|~|g")
  model_name=$(echo "$input" | grep -o '"display_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*:.*"\([^"]*\)".*/\1/')
  [ -z "$model_name" ] && model_name="Claude"
  model_version=""
  # Render minimal statusline without jq and exit
  printf '📁 %s' "$current_dir"
  if [ -n "$git_branch" ]; then
    printf '  🌿 %s' "$git_branch"
  fi
  printf '  🤖 %s' "$model_name"
  printf '\n'
  exit 0
fi

# ---- Native Claude Code data integration ----
session_txt=""
cost_usd=""; lines_added=0; lines_removed=0
context_pct=0; context_txt=""
BILLING_MODE="${CLAUDE_BILLING_MODE:-api}"

# Extract native cost data from Claude Code
cost_usd=$(echo "$input" | jq -r '.cost.total_cost_usd // empty' 2>/dev/null)
lines_added=$(echo "$input" | jq -r '.cost.total_lines_added // 0' 2>/dev/null)
lines_removed=$(echo "$input" | jq -r '.cost.total_lines_removed // 0' 2>/dev/null)

# Extract context window usage (Claude Code v2.0.65+)
# Calculate percentage against COMPACT THRESHOLD, not model limit
# 100% = compaction imminent
context_input=$(echo "$input" | jq -r '.context_window.total_input_tokens // 0' 2>/dev/null)
context_output=$(echo "$input" | jq -r '.context_window.total_output_tokens // 0' 2>/dev/null)
context_size=$(echo "$input" | jq -r '.context_window.context_window_size // 0' 2>/dev/null)

if [ -n "$context_size" ] && [ "$context_size" -gt 0 ] 2>/dev/null; then
  context_total=$((context_input + context_output))
  compact_threshold=$(get_compact_threshold "$context_size")

  # Calculate percentage against compact threshold
  context_pct=$((context_total * 100 / compact_threshold))
  # Clamp to 100% max to handle edge cases
  ((context_pct > 100)) && context_pct=100

  # Get severity emoji and progress bar
  severity_emoji=$(get_severity_emoji "$context_pct")
  bar=$(progress_bar "$context_pct" 12)
  context_txt="${severity_emoji} ${bar} ${context_pct}%"
fi

# Session timer - parse local transcript JSONL (zero external dependencies)
transcript_path=$(echo "$input" | jq -r '.transcript_path // empty' 2>/dev/null)

if [ -n "$transcript_path" ] && [ -f "$transcript_path" ]; then
  # Get first API call timestamp from session JSONL
  first_api_call=$(grep -m1 '"usage"' "$transcript_path" 2>/dev/null | jq -r '.timestamp // empty' 2>/dev/null)

  if [ -n "$first_api_call" ]; then
    # Calculate 5-hour billing block (Anthropic windows)
    # Blocks: 00:00-05:00, 05:00-10:00, 10:00-15:00, 15:00-20:00, 20:00-01:00 UTC
    current_utc_hour=$(date -u +%H)
    block_start=$((10#$current_utc_hour / 5 * 5))
    block_end=$((block_start + 5))

    # Handle day wraparound (e.g., 20:00 UTC block ends at 01:00 UTC next day)
    if [ $block_end -ge 24 ]; then
      block_end=$((block_end - 24))
      block_end_date="tomorrow"
    else
      block_end_date="today"
    fi

    # Calculate remaining time until block reset
    now_sec=$(date +%s)
    block_end_sec=$(date -u -d "${block_end_date} ${block_end}:00 UTC" +%s 2>/dev/null)

    if [ -n "$block_end_sec" ] && [ "$block_end_sec" -gt 0 ]; then
      remaining=$((block_end_sec - now_sec))

      if [ $remaining -gt 0 ] && [ $remaining -lt 18000 ]; then
        rh=$((remaining / 3600))
        rm=$(((remaining % 3600) / 60))
        block_end_local=$(date -d "@${block_end_sec}" +"%H:%M" 2>/dev/null)
        session_txt="${rh}h ${rm}m until reset at ${block_end_local}"
      fi
    fi
  fi
fi

# ---- render statusline (no ANSI colors - emoji only) ----
printf '📁 %s' "$current_dir"

# git display
if [ -n "$git_branch" ]; then
  printf '  🌿 %s' "$git_branch"
fi

printf '  🤖 %s' "$model_name"

if [ -n "$model_version" ] && [ "$model_version" != "null" ]; then
  printf ' %s' "$model_version"
fi

# session time
if [ -n "$session_txt" ]; then
  printf '  ⌛ %s' "$session_txt"
fi

# cost (only show for API billing mode)
if [ "$BILLING_MODE" = "api" ] && [ -n "$cost_usd" ] && [[ "$cost_usd" =~ ^[0-9.]+$ ]]; then
  printf '  💵 $%.4f' "$cost_usd"
fi

# lines changed
if [ -n "$lines_added" ] && [ -n "$lines_removed" ] && [[ "$lines_added" =~ ^[0-9]+$ ]] && [[ "$lines_removed" =~ ^[0-9]+$ ]]; then
  if [ "$lines_added" -gt 0 ] || [ "$lines_removed" -gt 0 ]; then
    printf '  📝 +%d -%d' "$lines_added" "$lines_removed"
  fi
fi

# context window usage (Claude Code v2.0.65+)
if [ -n "$context_txt" ]; then
  printf '  %s' "$context_txt"
fi

# trailing newline (POSIX compliance)
printf '\n'
