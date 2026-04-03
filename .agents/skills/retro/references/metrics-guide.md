# Metrics Reference Guide

Each metric: what it measures, why it matters, interpretation guidance, and the git command to compute it.

---

## Velocity Metrics

### Commits Per Day

**Measures:** Delivery cadence — how often work lands in the repo.
**Why it matters:** Low frequency may indicate large batched PRs (risky merges); high frequency with tiny commits suggests good trunk-based dev hygiene.
**Interpretation:**
- `< 1/day` — infrequent; check for blocked PRs or slow review cycles
- `1-3/day` — healthy for a solo dev or small team
- `> 5/day` — high activity; verify commits are meaningful, not noise

```bash
git log --since="$SINCE" --until="$UNTIL" --format="%ai" \
  | cut -d' ' -f1 | sort | uniq -c
```

### Active Day Ratio

**Measures:** What fraction of working days had at least one commit.
**Why it matters:** Consistent daily progress vs burst-then-idle patterns.
**Interpretation:** `> 70%` = consistent; `< 40%` = batchy; investigate blockers.

```bash
# Days with activity
git log --since="$SINCE" --until="$UNTIL" --format="%ai" \
  | cut -d' ' -f1 | sort -u | wc -l
# Divide by total calendar days in period
```

---

## Code Health Metrics

### LOC Added / Removed / Net

**Measures:** Raw volume of code written and deleted.
**Why it matters:** Net negative LOC (more deleted than added) is often a sign of healthy refactoring. Very high churn on specific files is a risk signal.
**Interpretation:**
- Net negative on non-test files = good (simplification)
- Net positive > 500 LOC/day sustained = high velocity, watch for quality regression

```bash
git log --since="$SINCE" --until="$UNTIL" --numstat --format="" \
  | awk 'NF==3 {add+=$1; del+=$2} END {print "added="add, "removed="del, "net="add-del}'
```

### File Hotspots

**Measures:** Which files change most frequently.
**Why it matters:** High-churn files are coupling magnets and defect attractors. Files appearing in > 30% of commits warrant refactoring.
**Interpretation:** Top 3 hotspots in every sprint signal architectural debt.

```bash
git log --since="$SINCE" --until="$UNTIL" --name-only --format="" \
  | sort | uniq -c | sort -rn | head -10
```

### Churn Rate

**Measures:** `(LOC_added + LOC_removed) / max(LOC_net, 1)` — how much code was rewritten vs kept.
**Why it matters:** Churn > 3x net LOC = significant rework; investigate root cause (unclear requirements, unstable APIs, poor initial design).
**Interpretation:**
- `1.0 - 1.5` = clean, additive work
- `1.5 - 3.0` = moderate iteration (normal)
- `> 3.0` = high rework; flag for retro discussion

---

## Quality Metrics

### Test-to-Code Ratio

**Measures:** `test_file_changes / total_file_changes * 100`
**Why it matters:** Proxy for whether tests accompany new code. Does not measure test quality, only presence.
**Interpretation:**
- `> 30%` = tests accompanying changes (healthy)
- `10-30%` = some test coverage added
- `< 10%` = tests lagging behind; technical debt accumulating

```bash
# Test file changes
git log --since="$SINCE" --until="$UNTIL" --name-only --format="" \
  | grep -E "(\.test\.|\.spec\.|__tests__|test_)" | wc -l

# Total file changes
git log --since="$SINCE" --until="$UNTIL" --name-only --format="" \
  | grep -v "^$" | wc -l
```

### Commit Type Distribution

**Measures:** Breakdown of conventional commit types (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `hotfix`).
**Why it matters:** Ratio reveals focus. Heavy `fix` ratio may indicate quality issues; heavy `chore` may mean infra debt; balanced mix = sustainable pace.
**Interpretation:**
- `feat > 40%` = feature-driven sprint
- `fix > 40%` = reactive sprint (bugs dominating)
- `refactor > 20%` = healthy investment in code quality

```bash
git log --since="$SINCE" --until="$UNTIL" --format="%s" \
  | sed 's/(.*//' | sed 's/:.*//' | sort | uniq -c | sort -rn
```

---

## Plan Metrics

### Plan Completion Rate

**Measures:** Closed GitHub issues / total issues opened in period (or checkbox ratio in plan files).
**Why it matters:** Tracks delivery predictability. Consistent undercompletion signals scope inflation or estimation issues.
**Interpretation:**
- `> 80%` = on track
- `60-80%` = acceptable; review blockers
- `< 60%` = scope or capacity mismatch; action needed

```bash
# Requires gh CLI
gh issue list --state closed --json closedAt,createdAt \
  --jq "[.[] | select(.closedAt >= \"$SINCE\")] | length"
```

```bash
# Plan file checkbox scan (fallback)
grep -r "\- \[x\]" plans/ | wc -l  # completed
grep -r "\- \[ \]" plans/ | wc -l  # open
```
