---
description: ⚡ Analyze the codebase and update documentation
argument-hint: [focused-topics] [should-scan-codebase]
---

Activate `scout` skill to analyze the codebase and update `docs/codebase-summary.md` and respond with a summary report.

## Arguments:
$1: Focused topics (default: all)
$2: Should scan codebase (`Boolean`, default: `false`)

## Focused Topics:
<focused_topics>$1</focused_topics>

## Should Scan Codebase:
<should_scan_codebase>$2</should_scan_codebase>

## Important:
- Use `docs/` directory as the source of truth for documentation.
- Do not scan the entire codebase unless the user explicitly requests it.

**IMPORTANT**: **Do not** start implementing.