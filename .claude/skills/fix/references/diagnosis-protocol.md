# Diagnosis Protocol

Structured root cause analysis methodology. Replaces ad-hoc guessing with evidence-based investigation.

## Core Principle

**NEVER guess root causes.** Form hypotheses through structured reasoning and test them against evidence.

## Pre-Diagnosis: Capture State (MANDATORY)

Before any investigation, capture the current broken state as baseline:

```
1. Record exact error messages (copy-paste, not paraphrase)
2. Record failing test output (full command + output)
3. Record relevant stack traces
4. Record relevant log snippets with timestamps
5. Record git status / recent changes: git log --oneline -10
```

This baseline is required for Step 5 (Verify) — you MUST compare before/after.

## Diagnosis Chain (Follow in Order)

### Phase 1: Observe — What is actually happening?

Read, don't assume. Use `ck:debug` (systematic-debugging Phase 1).

- What is the exact error message?
- Where does it occur? (file, line, function)
- When did it start? (check `git log`, `git bisect`)
- Can it be reproduced consistently?
- What is the expected vs actual behavior?

### Phase 2: Hypothesize — Why might this happen?

Activate `ck:sequential-thinking` skill. Form hypotheses through structured reasoning.

**Structured hypothesis formation:**
```
For each hypothesis:
  1. State the hypothesis clearly
  2. What evidence would CONFIRM it?
  3. What evidence would REFUTE it?
  4. How to test it quickly?
```

**Common hypothesis categories:**
- Recent code change introduced regression (`git log`, `git diff`)
- Data/state mismatch (wrong input, stale cache, race condition)
- Environment difference (deps version, config, platform)
- Missing validation (null check, type guard, boundary)
- Incorrect assumption (API contract, data shape, ordering)

### Phase 3: Test — Verify hypotheses against evidence

Spawn parallel `Explore` subagents to test each hypothesis simultaneously:

```
// Launch in SINGLE message — max 3 parallel agents
Task("Explore", "Test hypothesis A: [specific search/check]", "Verify H-A")
Task("Explore", "Test hypothesis B: [specific search/check]", "Verify H-B")
Task("Explore", "Test hypothesis C: [specific search/check]", "Verify H-C")
```

**For each hypothesis result:**
- CONFIRMED: Evidence supports this as root cause → proceed to root cause tracing
- REFUTED: Evidence contradicts → discard, note why
- INCONCLUSIVE: Need more data → refine hypothesis or gather more evidence

### Phase 4: Trace — Follow the root cause chain

Use `ck:debug` (root-cause-tracing technique). Trace backward:

```
Symptom (where error appears)
  ↑ Immediate cause (what triggered the error)
    ↑ Contributing factor (what set up the bad state)
      ↑ ROOT CAUSE (the original trigger that must be fixed)
```

**Rule:** NEVER fix where the error appears. Trace back to the source.

### Phase 5: Escalate — When hypotheses fail

If 2+ hypotheses are REFUTED:
1. Auto-activate `ck:problem-solving` skill
2. Apply Inversion Exercise: "What would CAUSE this bug intentionally?"
3. Apply Scale Game: "Does this fail with 1 item? 100? 10000?"
4. Consider environmental factors (timing, concurrency, platform)

If 3+ fix attempts fail after diagnosis:
1. STOP immediately
2. Question the architecture — is the design fundamentally flawed?
3. Discuss with user before attempting more

## Diagnosis Report Format

```markdown
## Diagnosis Report

**Issue:** [one-line description]
**Pre-fix state captured:** Yes/No

### Root Cause
[Clear explanation of the root cause, traced back to origin]

### Evidence Chain
1. [Observation] → led to hypothesis [X]
2. [Test result] → confirmed/refuted [X]
3. [Trace] → root cause at [file:line]

### Affected Scope
- Files: [list]
- Functions: [list]
- Dependencies: [list]

### Recommended Fix
[What to change and why — addressing root cause, not symptoms]

### Prevention Needed
[What guards/tests to add to prevent recurrence]
```

## Quick Mode Diagnosis

For trivial issues (type errors, lint, syntax), abbreviated diagnosis:

1. Read error message
2. Locate affected file(s) via scout results
3. Identify root cause (usually obvious for simple issues)
4. Skip parallel hypothesis testing
5. Still capture pre-fix state for verification
