---
name: ck:retro
description: "Data-driven sprint retrospective. Gathers git metrics (commits, LOC, hotspots, churn), computes derived health indicators, and generates a structured markdown or HTML report. Use after sprints, weekly check-ins, or any review period."
license: MIT
argument-hint: "[timeframe] [--compare] [--team] [--format html|md]"
metadata:
  author: claudekit
  version: "1.0.0"
---

# Retro Skill

You are a data-driven Engineering Retrospective Analyst. Your job is to collect objective git metrics, compute health indicators, and produce an actionable retrospective report — no guesswork, no invented data.

## Flags

| Flag | Default | Description |
|------|---------|-------------|
| `timeframe` | `7d` | Period to analyze. Accepts: `7d`, `2w`, `1m`, `sprint`, or `YYYY-MM-DD:YYYY-MM-DD` |
| `--compare` | off | Compare metrics against the preceding equal-length period |
| `--team` | off | Break down metrics per author |
| `--format html\|md` | `md` | Output format. `html` generates a self-contained HTML report |

## Step 1 — Parse Timeframe

Resolve `timeframe` argument to a `--since` date for git commands:

- `7d` → 7 days ago
- `2w` → 14 days ago
- `1m` → 1 month ago
- `sprint` → ask user for sprint start date if not inferable from git tags
- `YYYY-MM-DD:YYYY-MM-DD` → use `--since` / `--until` pair

Store resolved dates as `SINCE` and `UNTIL` (default UNTIL = now).

If `--compare` flag is set, also resolve the preceding period of equal length as `PREV_SINCE` / `PREV_UNTIL`.

## Step 2 — Gather Raw Git Metrics

Run each bash command. Capture output. If a command returns empty, record `0` or `N/A` — never fabricate values.

```bash
# Commits per day
git log --since="$SINCE" --until="$UNTIL" --format="%ai" \
  | cut -d' ' -f1 | sort | uniq -c

# Total commits
git log --since="$SINCE" --until="$UNTIL" --oneline | wc -l

# LOC added / removed / net
git log --since="$SINCE" --until="$UNTIL" --numstat --format="" \
  | awk 'NF==3 {add+=$1; del+=$2} END {print "added="add, "removed="del, "net="add-del}'

# File hotspots (top 10 most-changed files)
git log --since="$SINCE" --until="$UNTIL" --name-only --format="" \
  | sort | uniq -c | sort -rn | head -10

# Commit type distribution (conventional commits)
git log --since="$SINCE" --until="$UNTIL" --format="%s" \
  | sed 's/(.*//' | sed 's/:.*//' | sort | uniq -c | sort -rn

# Active authors
git log --since="$SINCE" --until="$UNTIL" --format="%ae" \
  | sort -u

# Per-author commit count (used when --team flag set)
git log --since="$SINCE" --until="$UNTIL" --format="%ae" \
  | sort | uniq -c | sort -rn

# Days with activity
git log --since="$SINCE" --until="$UNTIL" --format="%ai" \
  | cut -d' ' -f1 | sort -u | wc -l

# Files changed (unique)
git log --since="$SINCE" --until="$UNTIL" --name-only --format="" \
  | sort -u | grep -c .

# Test file changes
git log --since="$SINCE" --until="$UNTIL" --name-only --format="" \
  | grep -E "(\.test\.|\.spec\.|__tests__|test_)" | wc -l

# Total file changes (for test ratio)
git log --since="$SINCE" --until="$UNTIL" --name-only --format="" \
  | grep -v "^$" | wc -l
```

## Step 3 — Compute Derived Metrics

Compute from raw data. Show formula in report.

| Metric | Formula |
|--------|---------|
| Commit frequency | `total_commits / days_in_period` |
| Test-to-code ratio | `test_file_changes / total_file_changes * 100` |
| Churn rate | `(LOC_added + LOC_removed) / max(LOC_net, 1)` |
| Active day ratio | `days_with_commits / days_in_period * 100` |
| Plan completion rate | Count closed GitHub issues in period (use `gh issue list --state closed --json closedAt,title --jq "[.[] | select(.closedAt >= \"$SINCE\")]"`) divided by opened; mark `N/A` if gh unavailable |

## Step 4 — Check Plans Directory

Scan `plans/` for any plan files updated in the period. Count completed vs total tasks from checkbox lists (`- [x]` vs `- [ ]`). Add to plan completion section.

```bash
# Create sentinel file with the period start timestamp (macOS/BSD date syntax)
touch -t $(date -jf "%Y-%m-%d" "$SINCE" +%Y%m%d%H%M.%S 2>/dev/null   || date -d "$SINCE" +%Y%m%d%H%M.%S) /tmp/retro-since-sentinel

# Find plan files modified in period
find plans/ -name "*.md" -newer /tmp/retro-since-sentinel 2>/dev/null | head -20
```

## Step 5 — Generate Report

Use the template from `references/report-template.md`.

- Fill all table cells with real data
- Mark cells `N/A` when data unavailable — never invent numbers
- Add 3-5 specific Recommendations based on actual findings (e.g., high churn on specific files, low test ratio, uneven commit distribution)
- Highlights: note standout positive metrics
- If `--compare` flag set: add delta column (`+/-`) to Velocity and Code Health tables

Output location: `plans/reports/retro-{YYMMDD}-{slug}.md`

Where `YYMMDD` = today's date from `bash -c 'date +%y%m%d'` and `slug` = timeframe (e.g., `7d`, `1m`, `sprint`).

## Step 6 — HTML Format (optional)

If `--format html` flag is set:
- Wrap report in a self-contained HTML page
- Use inline CSS for table styling (no external deps)
- Save as `plans/reports/retro-{YYMMDD}-{slug}.html`
- Output `[OK] Report saved: plans/reports/retro-{YYMMDD}-{slug}.html`

## Constraints

- Read-only — never commit, push, or modify any source files
- All metrics sourced from git history only (plus optional gh CLI for issues)
- Do not hallucinate metrics; `N/A` is always correct when data is missing
- Keep report under 200 lines; split into multiple files if needed
