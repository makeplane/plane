# Git as Long-Term Memory

Git history is the loop's only persistent memory across iterations. Read it every time.

---

## Required Reads — Every Iteration

Run these at the start of Phase 1 (Review) without exception:

```bash
git log --oneline -20              # what changed and in what order
git diff HEAD~1                    # exact diff of last iteration
cat loop-results.tsv               # metric trend + keep/discard record
```

Together these answer three questions:
1. **What worked?** (kept=yes rows with positive delta)
2. **What failed?** (kept=no rows, repeated file paths)
3. **Where is the trend going?** (last 5 deltas — accelerating, flat, or reversing?)

---

## Pattern Recognition

### Exploit Successful Patterns

- Same file category that improved before → try adjacent files
- Same technique (e.g. adding edge-case tests) → apply to untouched functions
- Larger delta correlates with specific module → prioritize that module

### Avoid Failed Patterns

- File + technique combination that was discarded → do not retry same pair
- Zero-delta changes (e.g. refactors that don't move the metric) → skip unless required by guard
- Oscillating metric on a file → leave it, move elsewhere

### Detect Diminishing Returns

If last 5 kept iterations all have `delta < Min-Delta * 2`, the low-hanging fruit is gone. Signal:
- Broaden scope to adjacent files
- Switch technique entirely
- Report plateau to user rather than grinding

---

## Stuck Detection Integration

Track consecutive discards in a shell variable or temp file across phases:

```bash
CONSEC_DISCARDS=0   # reset on keep, increment on discard

# After Phase 6 decision:
if kept; then
  CONSEC_DISCARDS=0
else
  CONSEC_DISCARDS=$((CONSEC_DISCARDS + 1))
fi

# Phase 8 checks:
[ $CONSEC_DISCARDS -ge 5 ]  && shift_strategy
[ $CONSEC_DISCARDS -ge 10 ] && stop_loop
```

---

## Revert vs Reset

Always prefer `git revert`. Only fall back to `git reset` when revert produces a conflict.

| Command | Preserves history | Safe for pattern analysis | Use when |
|---------|------------------|--------------------------|----------|
| `git revert HEAD --no-edit` | Yes | Yes | Default discard path |
| `git reset --hard HEAD~1` | No | No | Revert conflicts only |

Reason: `git log --grep="loop(iter-"` relies on intact history. A reset destroys the record of what was tried and silently breaks pattern analysis in future iterations.

---

## Commit Message Convention

```
loop(iter-N): <one-line description of the change>
```

Examples:
```
loop(iter-3): add null guard to parseToken in lexer.ts
loop(iter-7): split large test fixture into focused unit cases
loop(iter-12): remove unused lodash import reducing bundle 1.2kB
```

This convention enables targeted log queries:

```bash
# All loop commits
git log --oneline --grep="loop(iter-"

# Only kept changes (cross-reference with loop-results.tsv)
git log --oneline --grep="loop(iter-" | head -20
```

Reverted commits remain in history with the standard revert message:
```
Revert "loop(iter-4): ..."
```

This is intentional — discards are part of the experiment record.
