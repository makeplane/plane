---
name: ck:loop
description: "Autonomous iterative optimization loop — run N iterations against a mechanical metric, learn from git history, auto-keep/discard changes. Use for improving measurable metrics (coverage, performance, bundle size, etc.) through repeated experimentation."
argument-hint: "[Goal/Metric description] or inline config block"
metadata:
  author: claudekit
  attribution: "Core patterns adapted from autoresearch by Udit Goenka (MIT)"
  license: MIT
  version: "1.0.0"
---

# ck:loop — Autonomous Optimization Loop

> Constraint + Mechanical Metric + Fast Verification = Autonomous Improvement

## When to Use

- Improve a measurable metric (test coverage, bundle size, ESLint errors, Lighthouse score, etc.)
- Autonomous execution over N iterations without manual intervention
- Git-tracked experiments where you want rollback on regression
- Exploring a search space of code changes with consistent evaluation

## When NOT to Use

| Situation | Better Tool |
|-----------|-------------|
| Subjective goals ("make it cleaner") | `ck:cook` |
| Bug fixing with known root cause | `ck:fix` or `ck:debug` |
| One-shot tasks, no repetition needed | `ck:cook` |
| No mechanical metric to measure progress | `ck:cook --interactive` |
| Files outside a defined scope | manual approach |

## Configuration Format

Parsed from user message. Missing required fields trigger a **batched** `AskUserQuestion`.

### Required

| Field | Description | Example |
|-------|-------------|---------|
| `Goal` | Human description of what to improve | `"Increase test coverage in src/utils"` |
| `Scope` | Glob pattern(s) for editable files | `"src/utils/**/*.ts"` |
| `Verify` | Shell command that outputs **a single number** | `"npx jest --coverage --json \| jq '.coverageMap \| .. \| .s? \| to_entries \| map(.value) \| (map(select(.>0)) \| length) / length * 100' \| tail -1"` |

### Optional

| Field | Default | Description |
|-------|---------|-------------|
| `Guard` | none | Regression check command (exit 0 = pass) |
| `Iterations` | 10 | Maximum iterations to run |
| `Noise` | medium | Tolerance for metric variance: `low` / `medium` / `high` |
| `Min-Delta` | 0 | Minimum improvement to count as progress |
| `Direction` | higher | Whether `higher` or `lower` metric value is better |

## Interactive Setup

When required fields are missing, ask all at once:

```
AskUserQuestion({
  questions: [
    { question: "What metric do you want to improve? (e.g. 'test coverage in src/utils')", field: "Goal" },
    { question: "Which files may be edited? (glob, e.g. 'src/utils/**/*.ts')", field: "Scope" },
    { question: "Verify command — must print a single number to stdout", field: "Verify" },
    { question: "Guard command for regression check? (optional, press Enter to skip)", field: "Guard" }
  ]
})
```

## Core Protocol

See [`references/autonomous-loop-protocol.md`](references/autonomous-loop-protocol.md) for the full 8-phase specification.

**Key invariants:**
- ONE atomic change per iteration — atomicity test: can you describe it in one sentence without "and"?
- Commit BEFORE verify — git is memory, not a safety net
- Guard files are **read-only** — never modify files in guard command's scope
- Prefer `git revert` over `git reset` — preserve history

## Results Logging

Each iteration appends a TSV line to `loop-results.tsv` in the working directory:

```
iter  timestamp           metric  delta   kept  description
1     2026-03-27T13:50:00 82.4    +2.4    yes   add null checks to parser.ts
2     2026-03-27T13:51:10 81.9    -0.5    no    extract helper function
```

See [`references/autonomous-loop-protocol.md`](references/autonomous-loop-protocol.md) — Phase 7 for full schema.

## Stuck Detection

| Condition | Action |
|-----------|--------|
| 5 consecutive discards | Analyze patterns → shift strategy (different files, different approach) |
| 10 consecutive discards | STOP — report findings, surface to user |

## Example Invocations

### 1. Increase test coverage

```
/ck:loop
Goal: Increase test coverage in src/utils from ~60% to 80%
Scope: src/utils/**/*.ts, tests/utils/**/*.test.ts
Verify: npx jest tests/utils --coverage --coverageReporters=json-summary 2>/dev/null | node -e "const d=require('./coverage-summary.json');console.log(d.total.lines.pct)"
Guard: npx tsc --noEmit && npx jest --passWithNoTests
Iterations: 15
Direction: higher
```

### 2. Reduce bundle size

```
/ck:loop
Goal: Reduce main bundle size below 200KB
Scope: src/**/*.ts, src/**/*.tsx
Verify: npx vite build 2>/dev/null | grep "dist/index" | awk '{print $2}' | sed 's/kB//'
Guard: npx tsc --noEmit
Direction: lower
Min-Delta: 0.5
```

### 3. Eliminate ESLint errors

```
/ck:loop
Goal: Drive ESLint error count to zero in src/api
Scope: src/api/**/*.ts
Verify: npx eslint src/api --format=json 2>/dev/null | node -e "const r=require('/dev/stdin');console.log(r.reduce((a,f)=>a+f.errorCount,0))" || echo 999
Direction: lower
Iterations: 20
```

## Limitations (Honest)

- Cannot optimize subjective or aesthetic goals
- Cannot modify files outside the declared `Scope`
- Cannot modify files referenced by the `Guard` command
- Cannot guarantee improvement — some metrics have hard ceilings
- Requires a **git repository with a clean working tree** before starting
- `Verify` command must complete in **< 30 seconds** (otherwise loop is impractical)
- Does not parallelize iterations — sequential by design (each iteration learns from the last)

## References

- [`references/autonomous-loop-protocol.md`](references/autonomous-loop-protocol.md) — Full 8-phase loop spec, decision matrix, anti-patterns
- [`references/git-memory-pattern.md`](references/git-memory-pattern.md) — Git as cross-iteration memory, revert vs reset, commit conventions
