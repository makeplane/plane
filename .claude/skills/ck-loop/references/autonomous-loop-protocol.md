# Autonomous Loop Protocol

8-phase specification executed each iteration. Complete phases in order — no skipping.

---

## Phase 0: Precondition Checks (first iteration only)

Run once before the loop starts. Abort with clear error if any check fails.

1. Confirm current directory is a git repository (`git rev-parse --git-dir`)
2. Confirm working tree is clean (`git status --porcelain` → empty output)
3. Confirm current HEAD is on a named branch (not detached)
4. Check no stale lock files (`loop-results.tsv.lock`)
5. Resolve scope glob — confirm at least one file matches
6. Dry-run verify command — confirm it exits 0 and outputs a number
7. Dry-run guard command (if set) — confirm it exits 0
8. Record **baseline metric** as iteration 0 in `loop-results.tsv`

---

## Phase 1: Review

Read context before every iteration — do not skip even if "nothing changed".

```bash
git log --oneline -20              # recent history
git diff HEAD~1                    # last change detail
cat loop-results.tsv               # full results so far
```

Extract patterns:
- Which file types / functions yielded improvements?
- Which changes were consistently discarded?
- Is the metric trending, plateauing, or oscillating?

---

## Phase 2: Ideate

Pick **ONE** focused change. Rules:

- **Exploit** patterns from successful iterations
- **Avoid** repeating failed patterns (same file + same approach)
- **Atomicity test:** describe the change in one sentence. If the sentence contains "and", split into two iterations.
- Prefer high-leverage targets (files with low coverage, large bundle contributors, most lint errors)
- When stuck (3+ consecutive discards on same area), pivot to a different file or technique

---

## Phase 3: Modify

- Edit files within `Scope` only
- **Never** modify files referenced by the `Guard` command
- Ensure syntax is valid after edit (run `tsc --noEmit` or equivalent linter for the language)
- Keep changes minimal — one logical unit

---

## Phase 4: Commit

Commit **before** running verification. Git is the undo mechanism, not a post-hoc save.

```bash
git add <changed files>
git commit -m "loop(iter-N): <one-line description>"
```

Convention: `loop(iter-N):` prefix enables log filtering later.

---

## Phase 5: Verify

Run the configured verify command. Extract the numeric result.

```bash
RESULT=$(eval "$VERIFY_CMD")
DELTA=$(echo "$RESULT - $PREV_METRIC" | bc)
```

### Crash Recovery

| Outcome | Meaning | Action |
|---------|---------|--------|
| Exit 0, number printed | Success | Proceed to Phase 5.5 / 6 |
| Exit 0, no number | Bad command | Log `error:no-number`, revert, fix verify cmd |
| Exit non-zero | Verify crash | Log `error:verify-crash`, revert, treat as discard |
| Timeout (>30s) | Too slow | Log `error:timeout`, abort loop, surface to user |

---

## Phase 5.5: Guard (optional — skip if no Guard configured)

Run guard command after verify.

```bash
eval "$GUARD_CMD"
GUARD_EXIT=$?
```

| Guard Exit | Action |
|------------|--------|
| 0 (pass) | Proceed to Phase 6 |
| Non-zero (fail) | Revert commit, rework change (max 2 rework attempts), then discard |

If rework attempts exhausted: log as discarded with reason `guard-fail`, proceed to Phase 7.

---

## Phase 6: Decide

### Decision Matrix

| Metric Direction | Delta vs Min-Delta | Guard | Decision |
|------------------|--------------------|-------|----------|
| higher is better | delta ≥ Min-Delta | pass | **KEEP** |
| higher is better | delta < Min-Delta | pass | **DISCARD** (no progress) |
| lower is better  | delta ≤ -Min-Delta | pass | **KEEP** |
| lower is better  | delta > -Min-Delta | pass | **DISCARD** (no progress) |
| any | any | fail | **DISCARD** (guard fail) |
| any | verify crash | n/a | **DISCARD** (error) |

### Keep

- Update `PREV_METRIC` to current result
- Reset consecutive-discard counter to 0

### Discard

```bash
git revert HEAD --no-edit    # preferred: preserves history
# fallback only if revert conflicts:
# git reset --hard HEAD~1
```

- Increment consecutive-discard counter

---

## Phase 7: Log

Append one TSV line to `loop-results.tsv`:

```
{iter}\t{ISO8601_timestamp}\t{metric}\t{delta:+.2f}\t{kept:yes/no}\t{description}
```

Example:
```
3	2026-03-27T14:02:11	84.7	+2.3	yes	add branch coverage to tokenizer edge cases
4	2026-03-27T14:03:45	84.7	+0.0	no	extract shared assertion helper
```

---

## Phase 8: Repeat or Stop

Continue if ALL conditions met:
- Iteration count < configured max
- Consecutive discards < 10
- User has not interrupted (check for `loop-stop` file or Ctrl-C signal)

### Stuck Detection

| Consecutive Discards | Action |
|----------------------|--------|
| 5 | Analyze `loop-results.tsv` for patterns → shift strategy (different scope area, different technique) |
| 10 | **STOP** — surface findings to user, recommend manual intervention |

### Final Report

When loop ends (limit reached, stuck, or interrupted):

```
Loop complete: N iterations, K kept, best metric: X (baseline: Y, delta: +Z)
Kept changes: [list commit hashes and descriptions]
Discarded: [count] iterations
Recommendation: [continue / diminishing returns / target met]
```

---

## Anti-Patterns

| Anti-Pattern | Why It Fails | Correct Approach |
|--------------|--------------|------------------|
| Multiple changes per iteration | Cannot attribute metric change to specific edit | One atomic change only |
| Verify before commit | No rollback point if verify crashes mid-run | Always commit first |
| Editing guard-scope files | Guard becomes meaningless if you edit what it checks | Guard files are read-only |
| `git reset` instead of `git revert` | Destroys history, breaks pattern analysis | Use `git revert` |
| Skipping Phase 1 review | Repeats failed patterns, wastes iterations | Always read log + diff |
| Ignoring `Min-Delta` | Micro-improvements cause noise, no real progress | Set meaningful threshold |
